import { type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

// Billing/Stripe features removed — personal desktop tool has no billing.
export const billingRouter = {
	invoices: protectedProcedure.query(async () => {
		return [];
	}),

	details: protectedProcedure.query(async () => {
		return null;
	}),

	portal: protectedProcedure
		.input(
			z.object({
				flowType: z
					.enum(["payment_method_update", "general"])
					.optional()
					.default("general"),
			}),
		)
		.mutation(async () => {
			return { url: null };
		}),
} satisfies TRPCRouterRecord;
