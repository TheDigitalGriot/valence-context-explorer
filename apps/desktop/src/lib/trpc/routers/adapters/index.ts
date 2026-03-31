import type { AdapterSource } from "@valence/adapters";
import {
	ClaudeCodeHookAdapter,
	ClaudeCodeLogAdapter,
	CodexOTelAdapter,
	CursorLogAdapter,
} from "@valence/adapters";
import { z } from "zod";
import { publicProcedure, router } from "../..";

interface AdapterInfo {
	name: string;
	source: AdapterSource;
	type: "ingestion" | "intercept";
	active: boolean;
	healthy: boolean | null;
}

/**
 * Registry of all known adapters.
 * Instantiated lazily — we only call healthCheck when the user asks.
 */
const logAdapter = new ClaudeCodeLogAdapter();
const hookAdapter = new ClaudeCodeHookAdapter();
const codexAdapter = new CodexOTelAdapter();
const cursorAdapter = new CursorLogAdapter();

const ingestionAdapters = [logAdapter, codexAdapter, cursorAdapter] as const;
const interceptAdapters = [hookAdapter] as const;

export const createAdaptersRouter = () => {
	return router({
		/**
		 * List all installed adapters with their status.
		 */
		list: publicProcedure.query(async () => {
			const results: AdapterInfo[] = [];

			for (const adapter of ingestionAdapters) {
				let healthy: boolean | null = null;
				try {
					healthy = await adapter.healthCheck();
				} catch {
					healthy = false;
				}
				results.push({
					name: adapter.name,
					source: adapter.source,
					type: "ingestion",
					active: adapter.isActive,
					healthy,
				});
			}

			for (const adapter of interceptAdapters) {
				let healthy: boolean | null = null;
				try {
					healthy = await adapter.healthCheck();
				} catch {
					healthy = false;
				}
				results.push({
					name: adapter.name,
					source: adapter.source,
					type: "intercept",
					active: adapter.isListening,
					healthy,
				});
			}

			return results;
		}),

		/**
		 * Get detailed info about a specific adapter.
		 */
		get: publicProcedure
			.input(z.object({ name: z.string() }))
			.query(async ({ input }) => {
				const all = [
					...ingestionAdapters.map((a) => ({
						name: a.name,
						source: a.source,
						type: "ingestion" as const,
						active: a.isActive,
						hasWatch: typeof a.watch === "function",
					})),
					...interceptAdapters.map((a) => ({
						name: a.name,
						source: a.source,
						type: "intercept" as const,
						active: a.isListening,
						hasHooks: typeof a.registerHooks === "function",
					})),
				];
				return all.find((a) => a.name === input.name) ?? null;
			}),

		/**
		 * Run health check on a specific adapter.
		 */
		healthCheck: publicProcedure
			.input(z.object({ name: z.string() }))
			.query(async ({ input }) => {
				const adapter = [...ingestionAdapters, ...interceptAdapters].find(
					(a) => a.name === input.name,
				);
				if (!adapter)
					return { name: input.name, healthy: false, error: "Not found" };

				try {
					const healthy = await adapter.healthCheck();
					return { name: input.name, healthy, error: null };
				} catch (err) {
					return {
						name: input.name,
						healthy: false,
						error: err instanceof Error ? err.message : "Unknown error",
					};
				}
			}),
	});
};

export type AdaptersRouter = ReturnType<typeof createAdaptersRouter>;
