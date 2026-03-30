// Auth
export const AUTH_PROVIDERS = ["github", "google"] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

// Deep link protocol schemes (used for desktop OAuth callbacks)
export const PROTOCOL_SCHEMES = {
	DEV: "valence-dev",
	PROD: "valence",
} as const;

// Company
export const COMPANY = {
	NAME: "Valence",
	DOMAIN: "valence.sh",
	EMAIL_DOMAIN: "@valence.sh",
	GITHUB_URL: "https://github.com/valence-sh/valence",
	DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL || "https://docs.valence.sh",
	MARKETING_URL: process.env.NEXT_PUBLIC_MARKETING_URL || "https://valence.sh",
	TERMS_URL: `${process.env.NEXT_PUBLIC_MARKETING_URL || "https://valence.sh"}/terms`,
	PRIVACY_URL:
		(process.env.NEXT_PUBLIC_MARKETING_URL || "https://valence.sh") +
		"/privacy",
	CHANGELOG_URL:
		(process.env.NEXT_PUBLIC_MARKETING_URL || "https://valence.sh") +
		"/changelog",
	X_URL: "https://x.com/valence_sh",
	MAIL_TO: "mailto:founders@valence.sh",
	REPORT_ISSUE_URL: "https://github.com/valence-sh/valence/issues/new",
	DISCORD_URL: "https://discord.gg/cZeD9WYcV7",
} as const;

// Theme
export const THEME_STORAGE_KEY = "valence-theme";

// Download URLs
export const DOWNLOAD_URL_MAC_ARM64 = `${COMPANY.GITHUB_URL}/releases/latest/download/Valence-arm64.dmg`;

// Auth token configuration
export const TOKEN_CONFIG = {
	/** Access token lifetime in seconds (1 hour) */
	ACCESS_TOKEN_EXPIRY: 60 * 60,
	/** Refresh token lifetime in seconds (30 days) */
	REFRESH_TOKEN_EXPIRY: 30 * 24 * 60 * 60,
	/** Refresh access token when this many seconds remain (5 minutes) */
	REFRESH_THRESHOLD: 5 * 60,
} as const;

// PostHog
export const POSTHOG_COOKIE_NAME = "valence";

export const FEATURE_FLAGS = {
	/** Gates access to experimental Electric SQL tasks feature. */
	ELECTRIC_TASKS_ACCESS: "electric-tasks-access",
	/** Gates access to the experimental mobile-first agents UI on web. */
	WEB_AGENTS_UI_ACCESS: "web-agents-ui-access",
	/** Gates access to GitHub integration (currently buggy, internal only). */
	GITHUB_INTEGRATION_ACCESS: "github-integration-access",
	/** Gates access to Slack integration (internal only). */
	SLACK_INTEGRATION_ACCESS: "slack-integration-access",
	/** Gates access to Cloud features (environment variables, sandboxes). */
	CLOUD_ACCESS: "cloud-access",
	/** When enabled, blocks remote agent execution on the desktop (e.g., for enterprise orgs). */
	DISABLE_REMOTE_AGENT: "disable-remote-agent",
	/** Gates access to V2 Cloud features (host-service, cloud sprites). */
	V2_CLOUD: "v2-cloud",
} as const;
