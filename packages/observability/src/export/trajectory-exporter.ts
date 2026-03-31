import type { ShareGPTMessage, TrajectoryEntry, ExportOptions } from "./types";

/**
 * Convert a parsed session's messages into ShareGPT format for RL training.
 * Ported from Hermes Agent's trajectory.py.
 */
export function sessionToTrajectory(params: {
  sessionId: string;
  projectPath: string;
  messages: Array<{
    role: string;
    content: string | Array<{ type: string; text?: string; name?: string; input?: unknown }>;
    model?: string;
  }>;
  metrics?: {
    totalTokens?: number;
    costUsd?: number;
    startTime?: string;
  };
  options?: ExportOptions;
}): TrajectoryEntry | null {
  const { sessionId, projectPath, messages, metrics, options } = params;

  if (!messages || messages.length === 0) return null;

  const conversations: ShareGPTMessage[] = [];
  let model = "unknown";

  for (const msg of messages) {
    // Map roles to ShareGPT format
    const from = msg.role === "user" ? "human"
      : msg.role === "assistant" ? "gpt"
      : msg.role === "system" ? "system"
      : null;

    if (!from) continue;

    let value: string;
    if (typeof msg.content === "string") {
      value = msg.content;
    } else if (Array.isArray(msg.content)) {
      const parts: string[] = [];
      for (const block of msg.content) {
        if (block.type === "text" && block.text) {
          parts.push(block.text);
        } else if (block.type === "tool_use" && options?.includeToolCalls) {
          parts.push(`[Tool: ${block.name}]\n${JSON.stringify(block.input, null, 2)}`);
        } else if (block.type === "thinking" && block.text) {
          // Convert reasoning scratchpad to standard <think> tags
          parts.push(`<think>${block.text}</think>`);
        }
      }
      value = parts.join("\n\n");
    } else {
      continue;
    }

    if (!value.trim()) continue;

    conversations.push({ from, value });

    // Capture model from assistant messages
    if (msg.role === "assistant" && msg.model) {
      model = msg.model;
    }
  }

  if (conversations.length === 0) return null;

  return {
    conversations,
    timestamp: metrics?.startTime ?? new Date().toISOString(),
    model,
    completed: true, // We only export completed sessions from disk
    sessionId,
    projectPath,
    totalTokens: metrics?.totalTokens,
    costUsd: metrics?.costUsd,
  };
}

/**
 * Serialize trajectory entries to JSONL format (one JSON object per line).
 */
export function trajectoriesToJsonl(entries: TrajectoryEntry[]): string {
  return entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
}

/**
 * Parse a JSONL file back into trajectory entries.
 */
export function jsonlToTrajectories(jsonl: string): TrajectoryEntry[] {
  return jsonl
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as TrajectoryEntry);
}
