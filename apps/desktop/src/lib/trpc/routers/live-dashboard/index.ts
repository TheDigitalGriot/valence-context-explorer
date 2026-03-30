import { z } from "zod";
import { publicProcedure, router } from "../..";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";

export const liveDashboardEmitter = new EventEmitter();
liveDashboardEmitter.setMaxListeners(50);

export const createLiveDashboardRouter = () => {
	return router({
		watchEvents: publicProcedure.subscription(() => {
			return observable<Record<string, unknown>>((emit) => {
				const handler = (data: Record<string, unknown>) => {
					emit.next(data);
				};
				liveDashboardEmitter.on("event", handler);
				return () => {
					liveDashboardEmitter.off("event", handler);
				};
			});
		}),

		respondIntervention: publicProcedure
			.input(
				z.object({
					eventId: z.string(),
					decision: z.enum(["approve", "deny"]),
					reason: z.string().optional(),
				}),
			)
			.mutation(async ({ input }) => {
				liveDashboardEmitter.emit("intervention-response", {
					eventId: input.eventId,
					decision: input.decision,
					reason: input.reason,
				});
				return { success: true };
			}),
	});
};

export type LiveDashboardRouter = ReturnType<typeof createLiveDashboardRouter>;
