import { randomUUID } from "crypto";
import { BaseInterceptAdapter } from "../base/BaseInterceptAdapter";
import type {
	AdapterSource,
	EventType,
	HookConfig,
	HookDefinition,
	NormalizedEvent,
	RawEvent,
} from "../shared/types";
import { HookEventServer } from "./HookEventServer";

export interface ClaudeCodeHookAdapterOptions {
	/** Port for the local event server (default: 4100) */
	port?: number;
}

/**
 * Real-time adapter for Claude Code's 12-hook system.
 *
 * Flow:
 *   1. Claude Code fires hooks -> hook scripts run -> scripts POST events to HookEventServer
 *   2. HookEventServer receives events on a local port
 *   3. ClaudeCodeHookAdapter listens to the server and normalizes events
 *
 * Call `registerHooks()` to get the hook configuration that should be
 * installed into Claude Code's `.claude/settings.json`.
 */
export class ClaudeCodeHookAdapter extends BaseInterceptAdapter {
	readonly name = "claude-code-hooks";
	readonly source: AdapterSource = "claude-code-hooks";

	private server: HookEventServer;
	private handler: ((event: NormalizedEvent) => void) | null = null;

	constructor(options?: ClaudeCodeHookAdapterOptions) {
		super();
		this.server = new HookEventServer({ port: options?.port });
	}

	onEvent(event: RawEvent): NormalizedEvent {
		return {
			eventId: randomUUID(),
			sessionId: event.sessionId,
			source: this.source,
			type: this.mapEventType(event.hookEventType),
			timestamp: new Date(event.timestamp),
			payload: event.payload,
			toolName: event.payload.tool_name as string | undefined,
			agentId: event.payload.agent_id as string | undefined,
		};
	}

	startListening(handler: (event: NormalizedEvent) => void): void {
		this.handler = handler;
		this.server.on("event", (raw: Record<string, unknown>) => {
			const rawEvent: RawEvent = {
				source: this.source,
				sessionId: (raw.session_id as string) || "unknown",
				hookEventType: (raw.hook_event_type as string) || "unknown",
				payload: (raw.payload as Record<string, unknown>) || raw,
				timestamp: (raw.timestamp as number) || Date.now(),
			};
			const normalized = this.onEvent(rawEvent);
			this.handler?.(normalized);
		});
		this.server.start();
		this._listening = true;
	}

	stopListening(): void {
		this.server.stop();
		this.server.removeAllListeners();
		this.handler = null;
		this._listening = false;
	}

	async healthCheck(): Promise<boolean> {
		if (!this._listening) return false;
		try {
			const res = await fetch(`${this.server.url}/health`);
			return res.ok;
		} catch {
			return false;
		}
	}

	/**
	 * Generate hook configuration for Claude Code's settings.json.
	 *
	 * Each hook type maps to a curl command that POSTs the event
	 * payload to the local HookEventServer.
	 */
	registerHooks(): HookConfig {
		const serverUrl = this.server.url;

		const makeHook = (
			eventType: EventType,
			blocking = false,
		): HookDefinition => ({
			command: `bun ${getSendEventScriptPath()} --event-type ${eventType} --session-id "$CLAUDE_SESSION_ID"`,
			timeoutMs: blocking ? 10_000 : 5_000,
			blocking,
		});

		return {
			hooks: {
				session_start: makeHook("session_start"),
				session_end: makeHook("session_end"),
				user_prompt_submit: makeHook("user_prompt_submit"),
				pre_tool_use: makeHook("pre_tool_use", true), // blocking for security
				post_tool_use: makeHook("post_tool_use"),
				post_tool_use_failure: makeHook("post_tool_use_failure"),
				permission_request: makeHook("permission_request", true), // blocking for HITL
				notification: makeHook("notification"),
				pre_compact: makeHook("pre_compact"),
				stop: makeHook("stop"),
				subagent_start: makeHook("subagent_start"),
				subagent_stop: makeHook("subagent_stop"),
			},
		};
	}

	/** Map hook event type strings (PascalCase or snake_case) to canonical EventType */
	private mapEventType(hookType: string): EventType {
		const map: Record<string, EventType> = {
			// PascalCase variants (from Claude Code's native format)
			SessionStart: "session_start",
			SessionEnd: "session_end",
			UserPromptSubmit: "user_prompt_submit",
			PreToolUse: "pre_tool_use",
			PostToolUse: "post_tool_use",
			PostToolUseFailure: "post_tool_use_failure",
			PermissionRequest: "permission_request",
			Notification: "notification",
			PreCompact: "pre_compact",
			Stop: "stop",
			SubagentStart: "subagent_start",
			SubagentStop: "subagent_stop",
			// snake_case pass-through
			session_start: "session_start",
			session_end: "session_end",
			user_prompt_submit: "user_prompt_submit",
			pre_tool_use: "pre_tool_use",
			post_tool_use: "post_tool_use",
			post_tool_use_failure: "post_tool_use_failure",
			permission_request: "permission_request",
			notification: "notification",
			pre_compact: "pre_compact",
			stop: "stop",
			subagent_start: "subagent_start",
			subagent_stop: "subagent_stop",
		};
		return map[hookType] || "notification"; // fallback to notification for unknown types
	}
}

/**
 * Resolve the path to the send-event.ts script.
 * In production this would resolve from the installed package location;
 * during development it resolves relative to this file.
 */
function getSendEventScriptPath(): string {
	return new URL("./hook-scripts/send-event.ts", import.meta.url).pathname;
}
