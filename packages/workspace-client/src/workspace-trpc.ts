import type { AppRouter } from "@valence/host-service/trpc";
import { createTRPCReact } from "@trpc/react-query";

export const workspaceTrpc = createTRPCReact<AppRouter>();
