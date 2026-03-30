// Base adapter classes
export { BaseIngestionAdapter, BaseInterceptAdapter } from "./base";

// Shared types and schemas
export type {
	AdapterSource,
	EventType,
	HookConfig,
	HookDefinition,
	NormalizedEvent,
	NormalizedTrace,
	RawEvent,
	RawSession,
	SubagentSummary,
	ToolCallSummary,
} from "./shared";

export { normalizedEventSchema, normalizedTraceSchema } from "./shared";

// Concrete adapters
export {
	ClaudeCodeLogAdapter,
	type ClaudeCodeLogAdapterOptions,
} from "./claude-code-logs";

export {
	ClaudeCodeHookAdapter,
	type ClaudeCodeHookAdapterOptions,
	HookEventServer,
	type HookEventServerOptions,
} from "./claude-code-hooks";
