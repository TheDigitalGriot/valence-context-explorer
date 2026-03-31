import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { publicProcedure, router } from "../..";

const EVALS_DIR = join(homedir(), ".valence", "data", "evals");

function ensureDir() {
	if (!existsSync(EVALS_DIR)) {
		mkdirSync(EVALS_DIR, { recursive: true });
	}
}

interface EvalCase {
	id: string;
	input: string;
	expectedOutput: string;
	tags: string[];
}

interface EvalRecord {
	id: string;
	name: string;
	description: string;
	cases: EvalCase[];
	createdAt: string;
	updatedAt: string;
}

async function loadAll(): Promise<EvalRecord[]> {
	ensureDir();
	const files = await readdir(EVALS_DIR);
	const records: EvalRecord[] = [];
	for (const file of files) {
		if (!file.endsWith(".json")) continue;
		try {
			const raw = await readFile(join(EVALS_DIR, file), "utf-8");
			records.push(JSON.parse(raw));
		} catch {
			// Skip corrupt files
		}
	}
	return records.sort(
		(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
	);
}

async function loadOne(id: string): Promise<EvalRecord | null> {
	const filePath = join(EVALS_DIR, `${id}.json`);
	if (!existsSync(filePath)) return null;
	const raw = await readFile(filePath, "utf-8");
	return JSON.parse(raw);
}

async function persist(record: EvalRecord): Promise<void> {
	ensureDir();
	await writeFile(
		join(EVALS_DIR, `${record.id}.json`),
		JSON.stringify(record, null, 2),
	);
}

export const createEvalsRouter = () => {
	return router({
		list: publicProcedure.query(async () => {
			return loadAll();
		}),

		get: publicProcedure
			.input(z.object({ id: z.string() }))
			.query(async ({ input }) => {
				return loadOne(input.id);
			}),

		create: publicProcedure
			.input(
				z.object({
					name: z.string().min(1),
					description: z.string().optional().default(""),
					cases: z
						.array(
							z.object({
								input: z.string(),
								expectedOutput: z.string(),
								tags: z.array(z.string()).optional().default([]),
							}),
						)
						.optional()
						.default([]),
				}),
			)
			.mutation(async ({ input }) => {
				const now = new Date().toISOString();
				const record: EvalRecord = {
					id: randomUUID(),
					name: input.name,
					description: input.description,
					cases: input.cases.map((c) => ({ ...c, id: randomUUID() })),
					createdAt: now,
					updatedAt: now,
				};
				await persist(record);
				return record;
			}),

		addCase: publicProcedure
			.input(
				z.object({
					evalId: z.string(),
					input: z.string(),
					expectedOutput: z.string(),
					tags: z.array(z.string()).optional().default([]),
				}),
			)
			.mutation(async ({ input }) => {
				const record = await loadOne(input.evalId);
				if (!record) return null;

				record.cases.push({
					id: randomUUID(),
					input: input.input,
					expectedOutput: input.expectedOutput,
					tags: input.tags,
				});
				record.updatedAt = new Date().toISOString();
				await persist(record);
				return record;
			}),

		delete: publicProcedure
			.input(z.object({ id: z.string() }))
			.mutation(async ({ input }) => {
				const filePath = join(EVALS_DIR, `${input.id}.json`);
				if (!existsSync(filePath)) return false;
				await unlink(filePath);
				return true;
			}),
	});
};

export type EvalsRouter = ReturnType<typeof createEvalsRouter>;
