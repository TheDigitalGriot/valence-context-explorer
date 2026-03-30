/**
 * ClaudeCodeLogAdapter - Concrete adapter for ingesting Claude Code session logs.
 *
 * Wraps @valence/observability's ProjectScanner, SessionParser, ChunkBuilder,
 * and FileWatcher to discover, parse, and watch Claude Code sessions from
 * ~/.claude/projects/.
 */

import { BaseIngestionAdapter } from "../base/BaseIngestionAdapter";
import type {
	AdapterSource,
	NormalizedTrace,
	RawSession,
	SubagentSummary,
	ToolCallSummary,
} from "../shared/types";

import {
	ProjectScanner,
	SubagentResolver,
} from "@valence/observability";
import {
	SessionParser,
	type ParsedSession,
} from "@valence/observability";
import { ChunkBuilder } from "@valence/observability";
import { FileWatcher, DataCache } from "@valence/observability";
import type { Session as ObsSession, Project, SessionMetrics } from "@valence/observability";

export interface ClaudeCodeLogAdapterOptions {
	/** Custom path to the Claude projects directory (defaults to ~/.claude/projects/) */
	claudeDir?: string;
}

/**
 * Raw data stored on each discovered RawSession.
 * Carries the observability-layer identifiers so parse() can retrieve data.
 */
interface ClaudeCodeSessionData {
	projectId: string;
	sessionId: string;
	projectPath: string;
	createdAt: number;
	hasSubagents: boolean;
	messageCount: number;
}

export class ClaudeCodeLogAdapter extends BaseIngestionAdapter {
	readonly name = "claude-code-logs";
	readonly source: AdapterSource = "claude-code-logs";

	private readonly scanner: ProjectScanner;
	private readonly parser: SessionParser;
	private readonly chunkBuilder: ChunkBuilder;
	private readonly subagentResolver: SubagentResolver;
	private readonly dataCache: DataCache;
	private fileWatcher: FileWatcher | null = null;

	constructor(options?: ClaudeCodeLogAdapterOptions) {
		super();

		// ProjectScanner accepts optional projectsDir; pass claudeDir if provided
		this.scanner = new ProjectScanner(options?.claudeDir);
		this.parser = new SessionParser(this.scanner);
		this.chunkBuilder = new ChunkBuilder();
		this.subagentResolver = new SubagentResolver(this.scanner);
		this.dataCache = new DataCache();
	}

	// ===========================================================================
	// Discovery
	// ===========================================================================

	/**
	 * Discover all available Claude Code sessions.
	 * Scans ~/.claude/projects/ and returns a RawSession for each session found.
	 */
	async discover(): Promise<RawSession[]> {
		const projects = await this.scanner.scan();
		const rawSessions: RawSession[] = [];

		for (const project of projects) {
			const sessions = await this.scanner.listSessions(project.id);

			for (const session of sessions) {
				rawSessions.push(this.toRawSession(project, session));
			}
		}

		return rawSessions;
	}

	// ===========================================================================
	// Parsing
	// ===========================================================================

	/**
	 * Parse a raw session into a NormalizedTrace.
	 * Uses SessionParser to read the JSONL, ChunkBuilder for structure,
	 * and SubagentResolver for subagent linkage.
	 */
	async parse(session: RawSession): Promise<NormalizedTrace> {
		const data = session.data as ClaudeCodeSessionData;
		const { projectId, sessionId } = data;

		// Parse the session JSONL
		const parsed: ParsedSession = await this.parser.parseSession(
			projectId,
			sessionId,
		);

		// Resolve subagents via Task tool calls
		const subagentProcesses = await this.subagentResolver.resolveSubagents(
			projectId,
			sessionId,
			parsed.taskCalls,
			parsed.messages,
		);

		// Extract time range
		const timeRange = this.parser.getTimeRange(parsed.messages);

		// Build tool call summaries from all assistant messages
		const toolCalls = this.extractToolCalls(parsed);

		// Build subagent summaries
		const subagents = this.extractSubagents(subagentProcesses);

		// Determine session status
		const status = this.inferStatus(parsed);

		return {
			traceId: `claude-code:${projectId}:${sessionId}`,
			sessionId,
			source: "claude-code-logs",
			projectPath: data.projectPath,
			startedAt: timeRange.start,
			endedAt: timeRange.durationMs > 0 ? timeRange.end : null,
			durationMs: timeRange.durationMs > 0 ? timeRange.durationMs : null,
			model: this.extractModel(parsed),
			inputTokens: parsed.metrics.inputTokens,
			outputTokens: parsed.metrics.outputTokens,
			cacheReadTokens: parsed.metrics.cacheReadTokens,
			cacheWriteTokens: parsed.metrics.cacheCreationTokens,
			costUsd: parsed.metrics.costUsd ?? null,
			toolCalls,
			subagents,
			status,
		};
	}

	// ===========================================================================
	// Watching
	// ===========================================================================

	/**
	 * Watch ~/.claude/ for session changes.
	 * Uses FileWatcher with debouncing and incremental detection.
	 */
	watch(onChange: (sessions: RawSession[]) => void): void {
		if (this.fileWatcher) {
			this.fileWatcher.stop();
		}

		this.fileWatcher = new FileWatcher(
			this.dataCache,
			this.scanner.getProjectsDir(),
		);
		this.fileWatcher.setProjectScanner(this.scanner);

		this.fileWatcher.on("file-change", async () => {
			try {
				const sessions = await this.discover();
				onChange(sessions);
			} catch {
				// Swallow errors during watch — caller can re-discover
			}
		});

		this.fileWatcher.start();
		this._active = true;
	}

	/**
	 * Stop watching for changes.
	 */
	stop(): void {
		if (this.fileWatcher) {
			this.fileWatcher.dispose();
			this.fileWatcher = null;
		}
		this._active = false;
	}

	// ===========================================================================
	// Private Helpers
	// ===========================================================================

	private toRawSession(project: Project, session: ObsSession): RawSession {
		const data: ClaudeCodeSessionData = {
			projectId: project.id,
			sessionId: session.id,
			projectPath: project.path,
			createdAt: session.createdAt,
			hasSubagents: session.hasSubagents,
			messageCount: session.messageCount,
		};

		return {
			id: `${project.id}:${session.id}`,
			source: "claude-code-logs",
			data,
			discoveredAt: new Date(),
		};
	}

	/**
	 * Extract tool call summaries from parsed session data.
	 */
	private extractToolCalls(parsed: ParsedSession): ToolCallSummary[] {
		const summaries: ToolCallSummary[] = [];

		for (const message of parsed.byType.assistant) {
			for (const tc of message.toolCalls) {
				// Try to find the matching result
				const resultInfo = this.parser.findToolResult(
					parsed.messages,
					tc.id,
				);

				summaries.push({
					toolName: tc.name,
					toolUseId: tc.id,
					durationMs: null, // Duration not directly available at message level
					success: resultInfo ? !resultInfo.result.isError : true,
					summary: tc.name,
				});
			}
		}

		return summaries;
	}

	/**
	 * Extract subagent summaries from resolved processes.
	 */
	private extractSubagents(
		processes: Awaited<ReturnType<SubagentResolver["resolveSubagents"]>>,
	): SubagentSummary[] {
		return processes.map((proc) => ({
			agentId: proc.id,
			agentType: proc.subagentType ?? "task",
			sessionId: proc.id,
			status: "completed" as const,
		}));
	}

	/**
	 * Extract the model name from parsed session.
	 * Looks at the first assistant message's model field if available.
	 */
	private extractModel(parsed: ParsedSession): string | null {
		for (const msg of parsed.byType.assistant) {
			if (msg.model) {
				return msg.model;
			}
		}
		return null;
	}

	/**
	 * Infer session status from parsed data.
	 */
	private inferStatus(
		parsed: ParsedSession,
	): "running" | "completed" | "errored" | "cancelled" {
		if (parsed.messages.length === 0) {
			return "completed";
		}

		const lastMsg = parsed.messages[parsed.messages.length - 1]!;

		// If last message is from user with no assistant response, likely still running
		if (lastMsg.type === "user") {
			return "running";
		}

		// If the last assistant message has no content, session may still be running
		if (lastMsg.type === "assistant" && lastMsg.toolCalls.length === 0) {
			const text =
				typeof lastMsg.content === "string"
					? lastMsg.content
					: "";
			if (text.length === 0) {
				return "running";
			}
		}

		return "completed";
	}
}
