import { ChunkBuilder, ProjectScanner, SessionParser } from "@valence/observability";
import type { EnhancedChunk } from "@valence/observability";
import { z } from "zod";
import { publicProcedure, router } from "../..";

const scanner = new ProjectScanner();
const parser = new SessionParser(scanner);
const chunkBuilder = new ChunkBuilder();

export const createCostAnalyticsRouter = () => {
	return router({
		/**
		 * Get cost breakdown by agent source.
		 */
		getCostByAgent: publicProcedure
			.input(z.object({ days: z.number().optional().default(30) }).optional())
			.query(async ({ input }) => {
				const days = input?.days ?? 30;
				const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
				const projects = await scanner.scan();
				const agentCosts = new Map<string, { cost: number; traceCount: number }>();

				for (const project of projects) {
					for (const sessionId of project.sessions ?? []) {
						try {
							const parsed = await parser.parseSession(project.id, sessionId);
							if (!parsed?.metrics) continue;

							// Use first message timestamp for date filtering
							const firstMsg = parsed.messages[0];
							const sessionDate = firstMsg?.timestamp ?? new Date(project.createdAt);
							if (sessionDate < cutoff) continue;

							const agent = "Claude Code";
							const cost = parsed.metrics.costUsd ?? 0;
							const existing = agentCosts.get(agent) ?? { cost: 0, traceCount: 0 };
							existing.cost += cost;
							existing.traceCount += 1;
							agentCosts.set(agent, existing);
						} catch {
							// Skip unparseable sessions
						}
					}
				}

				return [...agentCosts.entries()].map(([agent, data]) => ({
					agent,
					cost: data.cost,
					traceCount: data.traceCount,
				}));
			}),

		/**
		 * Get daily spend data grouped by date and agent source.
		 */
		getDailySpend: publicProcedure
			.input(z.object({ days: z.number().optional().default(30) }).optional())
			.query(async ({ input }) => {
				const days = input?.days ?? 30;
				const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
				const projects = await scanner.scan();
				const dailyMap = new Map<string, Record<string, number>>();

				for (const project of projects) {
					for (const sessionId of project.sessions ?? []) {
						try {
							const parsed = await parser.parseSession(project.id, sessionId);
							if (!parsed?.metrics) continue;

							const firstMsg = parsed.messages[0];
							const sessionDate = firstMsg?.timestamp ?? new Date(project.createdAt);
							if (sessionDate < cutoff) continue;

							const dateKey = sessionDate.toISOString().slice(0, 10);
							const agent = "Claude Code";
							const cost = parsed.metrics.costUsd ?? 0;

							const existing = dailyMap.get(dateKey) ?? {};
							existing[agent] = (existing[agent] ?? 0) + cost;
							dailyMap.set(dateKey, existing);
						} catch {
							// Skip unparseable sessions
						}
					}
				}

				const agentSources = [
					...new Set(
						[...dailyMap.values()].flatMap((d) => Object.keys(d)),
					),
				];

				const data = [...dailyMap.entries()]
					.sort(([a], [b]) => a.localeCompare(b))
					.map(([date, agents]) => ({ date, ...agents }));

				return { data, agentSources };
			}),

		/**
		 * Get cost breakdown by tool/skill usage.
		 */
		getCostBySkill: publicProcedure
			.input(z.object({ days: z.number().optional().default(30) }).optional())
			.query(async ({ input }) => {
				const days = input?.days ?? 30;
				const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
				const projects = await scanner.scan();
				const skillMap = new Map<
					string,
					{ invocations: number; totalTokens: number }
				>();

				for (const project of projects) {
					for (const sessionId of project.sessions ?? []) {
						try {
							const parsed = await parser.parseSession(project.id, sessionId);
							if (!parsed?.metrics) continue;

							const firstMsg = parsed.messages[0];
							const sessionDate = firstMsg?.timestamp ?? new Date(project.createdAt);
							if (sessionDate < cutoff) continue;

							// Extract tool usage from AI chunks via toolExecutions
							const chunks: EnhancedChunk[] = chunkBuilder.buildChunks(
								parsed.messages,
							);
							for (const chunk of chunks) {
								if (chunk.chunkType !== "ai") continue;
								for (const toolExec of chunk.toolExecutions ?? []) {
									const toolName = toolExec.toolCall?.name ?? "unknown";
									const existing = skillMap.get(toolName) ?? {
										invocations: 0,
										totalTokens: 0,
									};
									existing.invocations += 1;
									skillMap.set(toolName, existing);
								}
							}
						} catch {
							// Skip unparseable sessions
						}
					}
				}

				return [...skillMap.entries()].map(([skill, data]) => ({
					skill,
					invocations: data.invocations,
					totalCost: 0, // Token-to-cost mapping requires model pricing table; returning 0 for now
					avgCostPerInvocation: 0,
					totalTokens: data.totalTokens,
				}));
			}),
	});
};

export type CostAnalyticsRouter = ReturnType<typeof createCostAnalyticsRouter>;
