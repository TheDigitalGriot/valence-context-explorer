import { EventEmitter } from "node:events";
import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { observable } from "@trpc/server/observable";
import type { SecurityScanResult } from "@valence/observability/security";
import {
	bashSecurityHook,
	maskSecret,
	scanContent,
	validateToolInput,
} from "@valence/observability/security";
import { z } from "zod";
import { publicProcedure, router } from "../..";

const DATA_DIR = join(homedir(), ".valence", "data", "mcp-observatory");
const LOG_FILE = join(DATA_DIR, "tool-calls.json");

function ensureDir() {
	if (!existsSync(DATA_DIR)) {
		mkdirSync(DATA_DIR, { recursive: true });
	}
}

interface ToolCallEntry {
	id: string;
	timestamp: string;
	toolName: string;
	toolInput: Record<string, unknown> | null;
	securityResult: SecurityScanResult;
	secretsFound: number;
	blocked: boolean;
}

const mcpEmitter = new EventEmitter();
mcpEmitter.setMaxListeners(50);

let toolCallLog: ToolCallEntry[] = [];

async function loadLog(): Promise<void> {
	ensureDir();
	if (!existsSync(LOG_FILE)) {
		toolCallLog = [];
		return;
	}
	try {
		const raw = await readFile(LOG_FILE, "utf-8");
		toolCallLog = JSON.parse(raw);
	} catch {
		toolCallLog = [];
	}
}

async function persistLog(): Promise<void> {
	ensureDir();
	// Keep last 1000 entries to prevent unbounded growth
	if (toolCallLog.length > 1000) {
		toolCallLog = toolCallLog.slice(-1000);
	}
	await writeFile(LOG_FILE, JSON.stringify(toolCallLog, null, 2));
}

// Load on module init — store promise so procedures can await it
const ready = loadLog();

export const createMcpObservatoryRouter = () => {
	return router({
		/**
		 * Record a tool call and run security analysis.
		 * Returns the security verdict.
		 */
		recordToolCall: publicProcedure
			.input(
				z.object({
					toolName: z.string(),
					toolInput: z.record(z.string(), z.unknown()).nullable(),
				}),
			)
			.mutation(async ({ input }) => {
				await ready;

				const securityResult = bashSecurityHook({
					toolName: input.toolName,
					toolInput: input.toolInput,
				});

				// Scan tool input for secrets and redact if any found
				const inputStr = input.toolInput ? JSON.stringify(input.toolInput) : "";
				const secrets = scanContent(inputStr);

				let safeInput = input.toolInput;
				if (secrets.length > 0 && safeInput) {
					// Redact detected secrets before persisting
					let redacted = JSON.stringify(safeInput);
					for (const secret of secrets) {
						const match = inputStr.match(new RegExp(secret.pattern));
						if (match) {
							redacted = redacted.replaceAll(match[0], maskSecret(match[0]));
						}
					}
					safeInput = JSON.parse(redacted);
				}

				const entry: ToolCallEntry = {
					id: crypto.randomUUID(),
					timestamp: new Date().toISOString(),
					toolName: input.toolName,
					toolInput: safeInput,
					securityResult,
					secretsFound: secrets.length,
					blocked: !securityResult.allowed,
				};

				toolCallLog.push(entry);
				await persistLog();

				mcpEmitter.emit("tool-call", entry);

				return entry;
			}),

		/**
		 * Validate tool input without recording it.
		 */
		validateInput: publicProcedure
			.input(
				z.object({
					toolName: z.string(),
					toolInput: z.unknown(),
				}),
			)
			.query(({ input }) => {
				const [valid, reason] = validateToolInput(
					input.toolName,
					input.toolInput,
				);
				return { valid, reason };
			}),

		/**
		 * Get recent tool call history with optional filtering.
		 */
		getHistory: publicProcedure
			.input(
				z
					.object({
						limit: z.number().int().positive().optional().default(100),
						blockedOnly: z.boolean().optional().default(false),
						toolName: z.string().optional(),
					})
					.optional(),
			)
			.query(async ({ input }) => {
				await ready;
				let results = [...toolCallLog];

				if (input?.blockedOnly) {
					results = results.filter((e) => e.blocked);
				}
				if (input?.toolName) {
					results = results.filter((e) => e.toolName === input.toolName);
				}

				return results.slice(-(input?.limit ?? 100)).reverse();
			}),

		/**
		 * Get anomaly summary — counts of blocked calls, secret detections, etc.
		 */
		getAnomalySummary: publicProcedure.query(async () => {
			await ready;
			const totalCalls = toolCallLog.length;
			const blockedCalls = toolCallLog.filter((e) => e.blocked).length;
			const secretDetections = toolCallLog.filter(
				(e) => e.secretsFound > 0,
			).length;

			const toolBreakdown = new Map<
				string,
				{ total: number; blocked: number }
			>();
			for (const entry of toolCallLog) {
				const existing = toolBreakdown.get(entry.toolName) ?? {
					total: 0,
					blocked: 0,
				};
				existing.total += 1;
				if (entry.blocked) existing.blocked += 1;
				toolBreakdown.set(entry.toolName, existing);
			}

			return {
				totalCalls,
				blockedCalls,
				secretDetections,
				blockRate:
					totalCalls > 0 ? Math.round((blockedCalls / totalCalls) * 100) : 0,
				byTool: [...toolBreakdown.entries()].map(([tool, data]) => ({
					tool,
					...data,
				})),
			};
		}),

		/**
		 * Real-time subscription for tool call events.
		 */
		watchToolCalls: publicProcedure.subscription(() => {
			return observable<ToolCallEntry>((emit) => {
				const handler = (entry: ToolCallEntry) => {
					emit.next(entry);
				};
				mcpEmitter.on("tool-call", handler);
				return () => {
					mcpEmitter.off("tool-call", handler);
				};
			});
		}),
	});
};

export type McpObservatoryRouter = ReturnType<
	typeof createMcpObservatoryRouter
>;
