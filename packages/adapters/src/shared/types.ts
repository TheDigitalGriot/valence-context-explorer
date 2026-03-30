/** Where trace data comes from */
export type AdapterSource =
	| "claude-code-logs" // ~/.claude/ JSONL files
	| "claude-code-hooks" // Real-time hook events
	| "codex-otel" // OpenTelemetry spans
	| "cursor-logs" // Cursor log files
	| "agent-sdk" // In-process SDK callbacks
	| "custom"; // User-defined source

/** Raw session before normalization (adapter-specific) */
export interface RawSession {
	id: string;
	source: AdapterSource;
	/** Adapter-specific raw data */
	data: unknown;
	/** When the session was discovered */
	discoveredAt: Date;
}

/** Raw event before normalization (adapter-specific) */
export interface RawEvent {
	source: AdapterSource;
	sessionId: string;
	hookEventType: string;
	payload: Record<string, unknown>;
	timestamp: number;
}

/** Normalized trace — canonical 17-field schema */
export interface NormalizedTrace {
	/** Unique trace identifier */
	traceId: string;
	/** Session identifier from the agent */
	sessionId: string;
	/** Which adapter produced this trace */
	source: AdapterSource;
	/** Project/repo path this session relates to */
	projectPath: string;
	/** When the session started */
	startedAt: Date;
	/** When the session ended (null if ongoing) */
	endedAt: Date | null;
	/** Total duration in milliseconds */
	durationMs: number | null;
	/** Model used (e.g., "claude-sonnet-4-5-20250514") */
	model: string | null;
	/** Total input tokens */
	inputTokens: number;
	/** Total output tokens */
	outputTokens: number;
	/** Total cache read tokens */
	cacheReadTokens: number;
	/** Total cache write tokens */
	cacheWriteTokens: number;
	/** Estimated cost in USD */
	costUsd: number | null;
	/** Tool calls made during the session */
	toolCalls: ToolCallSummary[];
	/** Subagent/subprocess sessions spawned */
	subagents: SubagentSummary[];
	/** Session status */
	status: "running" | "completed" | "errored" | "cancelled";
}

/** Normalized event — real-time event from an intercept adapter */
export interface NormalizedEvent {
	/** Unique event identifier */
	eventId: string;
	/** Session this event belongs to */
	sessionId: string;
	/** Which adapter produced this event */
	source: AdapterSource;
	/** Event type (maps to the 12 hook types) */
	type: EventType;
	/** When the event occurred */
	timestamp: Date;
	/** Event-specific payload */
	payload: Record<string, unknown>;
	/** Tool name if this is a tool-related event */
	toolName?: string;
	/** Agent ID if this is a subagent event */
	agentId?: string;
}

/** The 12 event types from Claude Code hooks */
export type EventType =
	| "session_start"
	| "session_end"
	| "user_prompt_submit"
	| "pre_tool_use"
	| "post_tool_use"
	| "post_tool_use_failure"
	| "permission_request"
	| "notification"
	| "pre_compact"
	| "stop"
	| "subagent_start"
	| "subagent_stop";

export interface ToolCallSummary {
	toolName: string;
	toolUseId: string;
	/** Duration in ms */
	durationMs: number | null;
	/** Whether the call succeeded */
	success: boolean;
	/** Brief summary of what the tool did */
	summary?: string;
}

export interface SubagentSummary {
	agentId: string;
	agentType: string;
	sessionId: string;
	status: "running" | "completed" | "errored";
}

/** Hook configuration for intercept adapters */
export interface HookConfig {
	/** Hook definitions keyed by event type */
	hooks: Record<EventType, HookDefinition>;
}

export interface HookDefinition {
	/** Shell command to execute */
	command: string;
	/** Timeout in ms */
	timeoutMs?: number;
	/** Whether failure should block the agent */
	blocking: boolean;
}
