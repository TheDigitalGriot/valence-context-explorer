import type { ValidationResult } from "./types";

const TOOL_REQUIRED_KEYS: Record<string, string[]> = {
  Bash: ["command"],
  Read: ["file_path"],
  Write: ["file_path", "content"],
  Edit: ["file_path", "old_string", "new_string"],
  Glob: ["pattern"],
  Grep: ["pattern"],
};

export function validateToolInput(
  toolName: string,
  toolInput: unknown,
): ValidationResult {
  if (toolInput == null) {
    return [false, `Tool '${toolName}' called with null/undefined input`];
  }
  if (typeof toolInput !== "object") {
    return [false, `Tool '${toolName}' input must be an object, got ${typeof toolInput}`];
  }

  const required = TOOL_REQUIRED_KEYS[toolName];
  if (!required) return [true, ""];

  const input = toolInput as Record<string, unknown>;
  for (const key of required) {
    if (!(key in input) || input[key] == null) {
      return [false, `Tool '${toolName}' missing required key '${key}'`];
    }
  }

  return [true, ""];
}
