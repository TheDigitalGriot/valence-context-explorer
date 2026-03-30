import { z } from "zod";
import { publicProcedure, router } from "../..";
import { observable } from "@trpc/server/observable";
import {
	ProjectScanner,
	SessionParser,
	SessionSearcher,
	ChunkBuilder,
	DataCache,
	FileWatcher,
} from "@valence/observability";

/**
 * Shared singleton instances for the traces router.
 * ProjectScanner auto-creates a LocalFileSystemProvider internally.
 */
const scanner = new ProjectScanner();
const sessionParser = new SessionParser(scanner);
const chunkBuilder = new ChunkBuilder();
const dataCache = new DataCache();
const fileWatcher = new FileWatcher(dataCache);

export const createTracesRouter = () => {
	return router({
		/**
		 * List all projects and their sessions from ~/.claude/projects/
		 */
		list: publicProcedure.query(async () => {
			const projects = await scanner.scan();
			return projects;
		}),

		/**
		 * Get a fully parsed session with chunks, subagent data, and waterfall info.
		 */
		getSession: publicProcedure
			.input(
				z.object({
					projectPath: z.string(),
					sessionId: z.string(),
				})
			)
			.query(async ({ input }) => {
				const parsed = await sessionParser.parseSession(
					input.projectPath,
					input.sessionId
				);
				const chunks = chunkBuilder.buildChunks(parsed.messages);
				return {
					messages: parsed.messages,
					metrics: parsed.metrics,
					taskCalls: parsed.taskCalls,
					byType: parsed.byType,
					sidechainMessages: parsed.sidechainMessages,
					mainMessages: parsed.mainMessages,
					chunks,
				};
			}),

		/**
		 * Full-text search across sessions within a project.
		 */
		search: publicProcedure
			.input(
				z.object({
					query: z.string(),
					projectId: z.string().optional(),
					limit: z.number().optional().default(50),
				})
			)
			.query(async ({ input }) => {
				if (!input.projectId) {
					// Search across all projects by scanning first
					const projects = await scanner.scan();
					const allResults = [];
					for (const project of projects) {
						const results = await scanner.searchSessions(
							project.id,
							input.query,
							input.limit
						);
						allResults.push(...results.results);
						if (allResults.length >= input.limit) break;
					}
					return {
						results: allResults.slice(0, input.limit),
						query: input.query,
					};
				}
				const results = await scanner.searchSessions(
					input.projectId,
					input.query,
					input.limit
				);
				return results;
			}),

		/**
		 * Token counts, cost estimates, and tool usage stats for a session.
		 */
		getMetrics: publicProcedure
			.input(
				z.object({
					projectPath: z.string(),
					sessionId: z.string(),
				})
			)
			.query(async ({ input }) => {
				const parsed = await sessionParser.parseSession(
					input.projectPath,
					input.sessionId
				);
				return parsed.metrics;
			}),

		/**
		 * Subscription for live file change events.
		 * Uses observable() pattern required by trpc-electron.
		 */
		watchUpdates: publicProcedure.subscription(() => {
			return observable<{ type: string; path: string }>((emit) => {
				const onChange = (_eventType: string, filename: string | null) => {
					emit.next({
						type: "session-changed",
						path: filename ?? "",
					});
				};

				fileWatcher.on("change", onChange);
				fileWatcher.start();

				return () => {
					fileWatcher.removeListener("change", onChange);
				};
			});
		}),
	});
};

export type TracesRouter = ReturnType<typeof createTracesRouter>;
