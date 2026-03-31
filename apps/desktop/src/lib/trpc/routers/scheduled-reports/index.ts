import { z } from "zod";
import { publicProcedure, router } from "../..";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";

export const reportEmitter = new EventEmitter();
reportEmitter.setMaxListeners(10);

interface ScheduledReport {
	id: string;
	name: string;
	intervalMs: number;
	lastRun: string | null;
	enabled: boolean;
}

const reports = new Map<string, ScheduledReport>();
const timers = new Map<string, ReturnType<typeof setInterval>>();

let reportIdCounter = 0;

function startReportTimer(report: ScheduledReport) {
	// Clear existing timer
	const existing = timers.get(report.id);
	if (existing) clearInterval(existing);

	if (!report.enabled) return;

	const timer = setInterval(() => {
		report.lastRun = new Date().toISOString();
		reportEmitter.emit("report", {
			reportId: report.id,
			name: report.name,
			generatedAt: report.lastRun,
		});
	}, report.intervalMs);

	timers.set(report.id, timer);
}

export const createScheduledReportsRouter = () => {
	return router({
		list: publicProcedure.query(() => {
			return [...reports.values()];
		}),

		create: publicProcedure
			.input(
				z.object({
					name: z.string().min(1).max(100),
					intervalMs: z.number().min(60_000).max(86_400_000), // 1min to 24h
					enabled: z.boolean().optional().default(true),
				}),
			)
			.mutation(({ input }) => {
				const id = `report-${++reportIdCounter}`;
				const report: ScheduledReport = {
					id,
					name: input.name,
					intervalMs: input.intervalMs,
					lastRun: null,
					enabled: input.enabled,
				};
				reports.set(id, report);
				startReportTimer(report);
				return report;
			}),

		toggle: publicProcedure
			.input(z.object({ id: z.string(), enabled: z.boolean() }))
			.mutation(({ input }) => {
				const report = reports.get(input.id);
				if (!report) throw new Error(`Report ${input.id} not found`);
				report.enabled = input.enabled;
				startReportTimer(report);
				return report;
			}),

		delete: publicProcedure
			.input(z.object({ id: z.string() }))
			.mutation(({ input }) => {
				const timer = timers.get(input.id);
				if (timer) clearInterval(timer);
				timers.delete(input.id);
				reports.delete(input.id);
				return { deleted: true };
			}),

		onReport: publicProcedure.subscription(() => {
			return observable<{ reportId: string; name: string; generatedAt: string }>(
				(emit) => {
					const handler = (data: { reportId: string; name: string; generatedAt: string }) => {
						emit.next(data);
					};
					reportEmitter.on("report", handler);
					return () => reportEmitter.off("report", handler);
				},
			);
		}),
	});
};

export type ScheduledReportsRouter = ReturnType<typeof createScheduledReportsRouter>;
