import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import { auth } from "@valence/auth/server";

export const GET = oauthProviderAuthServerMetadata(auth);
