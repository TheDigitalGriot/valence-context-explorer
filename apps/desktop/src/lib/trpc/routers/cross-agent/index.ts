import { ProjectScanner, SessionParser } from "@valence/observability";
import { gitIdentityResolver } from "@valence/observability/parsing";
import { z } from "zod";
import { publicProcedure, router } from "../..";

const scanner = new ProjectScanner();
const parser = new SessionParser(scanner);

interface AgentSession {
	sessionId: string;
	projectPath: string;
	agent: string;
	repoUrl: string | null;
	repoName: string;
	startTime: string;
	tokenCount: number;
	costUsd: number;
	toolCallCount: number;
}

export const createCrossAgentRouter = () => {
	return router({
		/**
		 * Get all sessions grouped by repository, across all agents.
		 */
		getSessionsByRepo: publicProcedure
			.input(z.object({ days: z.number().optional().default(30) }).optional())
			.query(async ({ input }) => {
				const days = input?.days ?? 30;
				const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
				const projects = await scanner.scan();

				const sessions: AgentSession[] = [];

				for (const project of projects) {
					// Resolve git identity for this project
					let repoUrl: string | null = null;
					let repoName = project.path.split(/[/\\]/).pop() ?? project.path;
					try {
						const identity = await gitIdentityResolver.resolveIdentity(
							project.path,
						);
						if (identity) {
							repoUrl = identity.remoteUrl ?? null;
							repoName = identity.name ?? repoName;
						}
					} catch {
						// Not a git repo — use path-based name
					}

					for (const sessionId of project.sessions ?? []) {
						try {
							const parsed = await parser.parseSession(project.id, sessionId);
							if (!parsed?.metrics) continue;

							// Derive startTime from first message timestamp
							const firstMessage = parsed.messages[0];
							const startTime = firstMessage?.timestamp
								? firstMessage.timestamp.toISOString()
								: "";
							if (startTime && new Date(startTime) < cutoff) continue;

							// Count tool calls across all messages
							const toolCallCount = parsed.messages.reduce(
								(sum, m) => sum + (m.toolCalls?.length ?? 0),
								0,
							);

							sessions.push({
								sessionId,
								projectPath: project.path,
								agent: "Claude Code", // Default — adapters will provide this
								repoUrl,
								repoName,
								startTime,
								tokenCount:
									(parsed.metrics.inputTokens ?? 0) +
									(parsed.metrics.outputTokens ?? 0),
								costUsd: parsed.metrics.costUsd ?? 0,
								toolCallCount,
							});
						} catch {
							// Skip unparseable
						}
					}
				}

				// Group by repo
				const repoMap = new Map<
					string,
					{
						repoUrl: string | null;
						repoName: string;
						sessions: AgentSession[];
						agents: string[];
						totalCost: number;
						totalTokens: number;
					}
				>();

				for (const session of sessions) {
					const key = session.repoUrl ?? session.repoName;
					const existing = repoMap.get(key) ?? {
						repoUrl: session.repoUrl,
						repoName: session.repoName,
						sessions: [],
						agents: [],
						totalCost: 0,
						totalTokens: 0,
					};
					existing.sessions.push(session);
					existing.totalCost += session.costUsd;
					existing.totalTokens += session.tokenCount;
					if (!existing.agents.includes(session.agent)) {
						existing.agents.push(session.agent);
					}
					repoMap.set(key, existing);
				}

				return {
					repos: [...repoMap.values()].sort(
						(a, b) => b.totalCost - a.totalCost,
					),
					totalSessions: sessions.length,
					totalRepos: repoMap.size,
				};
			}),

		/**
		 * Get effectiveness comparison stats across agents.
		 */
		getAgentComparison: publicProcedure
			.input(z.object({ days: z.number().optional().default(30) }).optional())
			.query(async ({ input }) => {
				const days = input?.days ?? 30;
				const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
				const projects = await scanner.scan();

				const agentStats = new Map<
					string,
					{
						agent: string;
						sessionCount: number;
						totalCost: number;
						totalTokens: number;
						totalToolCalls: number;
						repos: Set<string>;
					}
				>();

				for (const project of projects) {
					const repoName = project.path.split(/[/\\]/).pop() ?? project.path;

					for (const sessionId of project.sessions ?? []) {
						try {
							const parsed = await parser.parseSession(project.id, sessionId);
							if (!parsed?.metrics) continue;

							// Derive startTime from first message
							const firstMessage = parsed.messages[0];
							const startTime = firstMessage?.timestamp
								? firstMessage.timestamp.toISOString()
								: "";
							if (startTime && new Date(startTime) < cutoff) continue;

							// Count tool calls
							const toolCallCount = parsed.messages.reduce(
								(sum, m) => sum + (m.toolCalls?.length ?? 0),
								0,
							);

							const agent = "Claude Code";
							const existing = agentStats.get(agent) ?? {
								agent,
								sessionCount: 0,
								totalCost: 0,
								totalTokens: 0,
								totalToolCalls: 0,
								repos: new Set<string>(),
							};

							existing.sessionCount += 1;
							existing.totalCost += parsed.metrics.costUsd ?? 0;
							existing.totalTokens +=
								(parsed.metrics.inputTokens ?? 0) +
								(parsed.metrics.outputTokens ?? 0);
							existing.totalToolCalls += toolCallCount;
							existing.repos.add(repoName);

							agentStats.set(agent, existing);
						} catch {
							// Skip
						}
					}
				}

				// Compute averages and serialize
				return [...agentStats.values()].map((s) => ({
					agent: s.agent,
					sessionCount: s.sessionCount,
					totalCost: s.totalCost,
					totalTokens: s.totalTokens,
					totalToolCalls: s.totalToolCalls,
					avgCostPerSession:
						s.sessionCount > 0 ? s.totalCost / s.sessionCount : 0,
					avgTokensPerSession:
						s.sessionCount > 0 ? s.totalTokens / s.sessionCount : 0,
					avgToolCallsPerSession:
						s.sessionCount > 0 ? s.totalToolCalls / s.sessionCount : 0,
					repoCount: s.repos.size,
				}));
			}),
	});
};

export type CrossAgentRouter = ReturnType<typeof createCrossAgentRouter>;
