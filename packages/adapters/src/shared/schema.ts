import { z } from "zod";
import type { NormalizedEvent, NormalizedTrace } from "./types";

/** Zod schema for validating NormalizedTrace */
export const normalizedTraceSchema = z.object({
	traceId: z.string(),
	sessionId: z.string(),
	source: z.enum([
		"claude-code-logs",
		"claude-code-hooks",
		"codex-otel",
		"cursor-logs",
		"agent-sdk",
		"custom",
	]),
	projectPath: z.string(),
	startedAt: z.date(),
	endedAt: z.date().nullable(),
	durationMs: z.number().nullable(),
	model: z.string().nullable(),
	inputTokens: z.number(),
	outputTokens: z.number(),
	cacheReadTokens: z.number(),
	cacheWriteTokens: z.number(),
	costUsd: z.number().nullable(),
	toolCalls: z.array(
		z.object({
			toolName: z.string(),
			toolUseId: z.string(),
			durationMs: z.number().nullable(),
			success: z.boolean(),
			summary: z.string().optional(),
		}),
	),
	subagents: z.array(
		z.object({
			agentId: z.string(),
			agentType: z.string(),
			sessionId: z.string(),
			status: z.enum(["running", "completed", "errored"]),
		}),
	),
	status: z.enum(["running", "completed", "errored", "cancelled"]),
}) satisfies z.ZodType<NormalizedTrace>;

/** Zod schema for validating NormalizedEvent */
export const normalizedEventSchema = z.object({
	eventId: z.string(),
	sessionId: z.string(),
	source: z.enum([
		"claude-code-logs",
		"claude-code-hooks",
		"codex-otel",
		"cursor-logs",
		"agent-sdk",
		"custom",
	]),
	type: z.enum([
		"session_start",
		"session_end",
		"user_prompt_submit",
		"pre_tool_use",
		"post_tool_use",
		"post_tool_use_failure",
		"permission_request",
		"notification",
		"pre_compact",
		"stop",
		"subagent_start",
		"subagent_stop",
	]),
	timestamp: z.date(),
	payload: z.record(z.string(), z.unknown()),
	toolName: z.string().optional(),
	agentId: z.string().optional(),
}) satisfies z.ZodType<NormalizedEvent>;
