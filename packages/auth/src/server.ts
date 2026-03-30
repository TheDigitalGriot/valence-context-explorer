import { expo } from "@better-auth/expo";
import { oauthProvider } from "@better-auth/oauth-provider";
import { db } from "@valence/db/client";
import { members } from "@valence/db/schema";
import type { sessions } from "@valence/db/schema/auth";
import * as authSchema from "@valence/db/schema/auth";
import { seedDefaultStatuses } from "@valence/db/seed-default-statuses";
import { canInvite, type OrganizationRole } from "@valence/shared/auth";
import { getTrustedVercelPreviewOrigins } from "@valence/shared/vercel-preview-origins";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
	apiKey,
	bearer,
	customSession,
	organization,
} from "better-auth/plugins";
import { jwt } from "better-auth/plugins/jwt";
import { and, eq, sql } from "drizzle-orm";
import { env } from "./env";
import { acceptInvitationEndpoint } from "./lib/accept-invitation-endpoint";
import {
	resolveSessionOrganizationState,
	type SessionOrganizationContext,
} from "./lib/resolve-session-organization-state";

const desktopDevPort = process.env.DESKTOP_VITE_PORT || "5173";
const desktopDevOrigins =
	process.env.NODE_ENV === "development"
		? [
				`http://localhost:${desktopDevPort}`,
				`http://127.0.0.1:${desktopDevPort}`,
			]
		: [];

export const auth = betterAuth({
	baseURL: env.NEXT_PUBLIC_API_URL,
	secret: env.BETTER_AUTH_SECRET,
	disabledPaths: [],
	database: drizzleAdapter(db, {
		provider: "pg",
		usePlural: true,
		schema: { ...authSchema },
	}),
	trustedOrigins: async (request) => [
		env.NEXT_PUBLIC_WEB_URL,
		env.NEXT_PUBLIC_API_URL,
		...(env.NEXT_PUBLIC_DESKTOP_URL ? [env.NEXT_PUBLIC_DESKTOP_URL] : []),
		...getTrustedVercelPreviewOrigins(request?.url ?? env.NEXT_PUBLIC_API_URL),
		...desktopDevOrigins,
		"valence://app",
		"valence://",
		...(process.env.NODE_ENV === "development"
			? ["exp://", "exp://**", "exp://192.168.*.*:*/**"]
			: []),
	],
	session: {
		expiresIn: 60 * 60 * 24 * 30,
		updateAge: 60 * 60 * 24,
		storeSessionInDatabase: true,
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5,
		},
	},
	advanced: {
		crossSubDomainCookies: {
			enabled: true,
			domain: env.NEXT_PUBLIC_COOKIE_DOMAIN,
		},
		database: {
			generateId: false,
		},
	},
	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
	},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					const domain = user.email.split("@")[1]?.toLowerCase();
					let enrolledOrgId: string | null = null;

					if (domain) {
						const matchingOrgs = await db.query.organizations.findMany({
							where: sql`${authSchema.organizations.allowedDomains} @> ARRAY[${domain}]::text[]`,
						});

						for (const org of matchingOrgs) {
							try {
								await auth.api.addMember({
									body: {
										organizationId: org.id,
										userId: user.id,
										role: "member",
									},
								});
								if (!enrolledOrgId) {
									enrolledOrgId = org.id;
								}
							} catch (error) {
								console.error(
									`[auto-enroll] Failed to add user ${user.id} to org ${org.id}:`,
									error,
								);
								const memberExists = await db.query.members.findFirst({
									where: and(
										eq(authSchema.members.organizationId, org.id),
										eq(authSchema.members.userId, user.id),
									),
								});
								if (memberExists && !enrolledOrgId) {
									enrolledOrgId = org.id;
								}
							}
						}
					}

					if (!enrolledOrgId) {
						const personalOrg = await auth.api.createOrganization({
							body: {
								name: `${user.name}'s Team`,
								slug: `${user.id.slice(0, 8)}-team`,
								userId: user.id,
							},
						});
						enrolledOrgId = personalOrg?.id ?? null;
					}

					if (enrolledOrgId) {
						await db
							.update(authSchema.sessions)
							.set({ activeOrganizationId: enrolledOrgId })
							.where(eq(authSchema.sessions.userId, user.id));
					}
				},
			},
		},
	},
	plugins: [
		apiKey({
			enableMetadata: true,
			enableSessionForAPIKeys: true,
			defaultPrefix: "sk_live_",
			rateLimit: {
				enabled: false,
			},
		}),
		jwt({
			jwks: {
				keyPairConfig: { alg: "RS256" },
			},
			jwt: {
				issuer: env.NEXT_PUBLIC_API_URL,
				audience: env.NEXT_PUBLIC_API_URL,
				expirationTime: "1h",
				definePayload: async ({
					user,
				}: {
					user: { id: string; email: string };
					session: Record<string, unknown>;
				}) => {
					const userMemberships = await db.query.members.findMany({
						where: eq(members.userId, user.id),
						columns: { organizationId: true },
					});
					const organizationIds = [
						...new Set(userMemberships.map((m) => m.organizationId)),
					];
					return { sub: user.id, email: user.email, organizationIds };
				},
			},
		}),
		oauthProvider({
			loginPage: `${env.NEXT_PUBLIC_WEB_URL}/sign-in`,
			consentPage: `${env.NEXT_PUBLIC_WEB_URL}/oauth/consent`,
			allowDynamicClientRegistration: true,
			allowUnauthenticatedClientRegistration: true,
			validAudiences: [env.NEXT_PUBLIC_API_URL, `${env.NEXT_PUBLIC_API_URL}/`],
			silenceWarnings: {
				oauthAuthServerConfig: true,
				openidConfig: true,
			},
			postLogin: {
				page: `${env.NEXT_PUBLIC_WEB_URL}/oauth/consent`,
				shouldRedirect: () => false,
				consentReferenceId: async ({ user, session }) => {
					const { activeOrganizationId } =
						await resolveSessionOrganizationState({
							userId: user?.id,
							session: session as SessionOrganizationContext | undefined,
						});
					return activeOrganizationId ?? undefined;
				},
			},
			customAccessTokenClaims: ({ referenceId }) => ({
				organizationId: referenceId ?? undefined,
			}),
		}),
		expo(),
		organization({
			creatorRole: "owner",
			invitationExpiresIn: 60 * 60 * 24 * 7,
			organizationHooks: {
				beforeCreateInvitation: async (data) => {
					const { inviterId, organizationId, role } = data.invitation;

					const inviterMember = await db.query.members.findFirst({
						where: and(
							eq(members.userId, inviterId),
							eq(members.organizationId, organizationId),
						),
					});

					if (!inviterMember) {
						throw new Error("Not a member of this organization");
					}

					if (
						!canInvite(
							inviterMember.role as OrganizationRole,
							role as OrganizationRole,
						)
					) {
						throw new Error("Cannot invite users with this role");
					}
				},

				afterCreateOrganization: async ({ organization }) => {
					await seedDefaultStatuses(organization.id);
				},
			},
		}),
		bearer(),
		customSession(async ({ user, session: baseSession }) => {
			const session = baseSession as typeof sessions.$inferSelect;
			const { activeOrganizationId, allMemberships, membership } =
				await resolveSessionOrganizationState({
					userId: session.userId ?? user.id,
					session,
				});

			const organizationIds = [
				...new Set(allMemberships.map((m) => m.organizationId)),
			];

			return {
				user,
				session: {
					...session,
					activeOrganizationId,
					organizationIds,
					role: membership?.role,
					plan: null,
				},
			};
		}),
		acceptInvitationEndpoint,
	],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
