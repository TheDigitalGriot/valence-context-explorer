import type {
	SelectInvitation,
	SelectMember,
	SelectUser,
} from "@valence/db/schema/auth";
import type { OrganizationRole } from "@valence/shared/auth";

export type TeamMember = SelectUser &
	SelectMember & {
		memberId: string;
		role: OrganizationRole;
	};

export type InvitationRow = SelectInvitation & {
	inviterName: string;
};
