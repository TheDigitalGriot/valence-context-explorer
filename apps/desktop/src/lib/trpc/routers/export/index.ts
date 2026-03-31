import { z } from "zod";
import { publicProcedure, router } from "../..";
import * as fs from "fs";
import * as path from "path";

export const createExportRouter = () => {
	return router({
		/**
		 * Export sessions as ShareGPT JSONL for RL training.
		 */
		exportTrajectories: publicProcedure
			.input(
				z.object({
					outputPath: z.string(),
					since: z.string().optional(),
					completedOnly: z.boolean().optional().default(true),
					includeToolCalls: z.boolean().optional().default(false),
				}),
			)
			.mutation(async ({ input }) => {
				// Dynamic import to avoid circular deps at module load
				const { ProjectScanner, SessionParser } = await import("@valence/observability");
				const { sessionToTrajectory, trajectoriesToJsonl } = await import(
					"@valence/observability/export"
				);

				const scanner = new ProjectScanner();
				const parser = new SessionParser(scanner);
				const projects = await scanner.scan();
				const since = input.since ? new Date(input.since) : undefined;
				const entries: Array<import("@valence/observability/export").TrajectoryEntry> = [];

				for (const project of projects) {
					for (const sessionId of project.sessions ?? []) {
						try {
							const parsed = await parser.parseSession(project.id, sessionId);
							if (!parsed?.messages) continue;

							const entry = sessionToTrajectory({
								sessionId,
								projectPath: project.path,
								messages: parsed.messages,
								metrics: parsed.metrics,
								options: {
									since,
									completedOnly: input.completedOnly,
									includeToolCalls: input.includeToolCalls,
								},
							});

							if (entry) entries.push(entry);
						} catch {
							// Skip unparseable sessions
						}
					}
				}

				const jsonl = trajectoriesToJsonl(entries);
				const outputDir = path.dirname(input.outputPath);
				if (!fs.existsSync(outputDir)) {
					fs.mkdirSync(outputDir, { recursive: true });
				}
				fs.writeFileSync(input.outputPath, jsonl, "utf-8");

				return {
					exported: entries.length,
					outputPath: input.outputPath,
					sizeBytes: Buffer.byteLength(jsonl, "utf-8"),
				};
			}),
	});
};

export type ExportRouter = ReturnType<typeof createExportRouter>;
