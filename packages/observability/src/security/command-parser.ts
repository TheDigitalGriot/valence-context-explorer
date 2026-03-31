const SHELL_KEYWORDS = new Set([
  "if", "then", "else", "elif", "fi", "for", "while", "until",
  "do", "done", "case", "esac", "in", "function", "select",
  "time", "coproc", "{", "}", "[[", "]]", "!", "true", "false",
]);

const SHELL_OPERATORS = new Set(["&&", "||", "|", ";", "&", "(", ")"]);

/**
 * Extract basename from a file path (cross-platform).
 */
export function crossPlatformBasename(filePath: string): string {
  // Handle Windows paths (C:\foo\bar.exe)
  const winMatch = filePath.match(/[/\\]([^/\\]+)$/);
  if (winMatch) return winMatch[1];
  return filePath;
}

/**
 * Split a compound shell command into segments on &&, ||, ;
 */
export function splitCommandSegments(commandString: string): string[] {
  const segments: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let escaped = false;

  for (const ch of commandString) {
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      current += ch;
      continue;
    }
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      current += ch;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      current += ch;
      continue;
    }
    if (!inSingle && !inDouble && (ch === ";" || ch === "&" || ch === "|")) {
      // Peek: don't split mid-operator (&&, ||)
      current += ch;
      continue;
    }
    current += ch;
  }

  // Split the accumulated string on && || ;
  const raw = current;
  const parts = raw.split(/\s*(?:&&|\|\||;)\s*/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed) segments.push(trimmed);
  }

  return segments;
}

/**
 * Extract command names (basenames) from a compound shell string.
 * Filters out shell keywords, operators, variable assignments, flags, redirects.
 */
export function extractCommands(commandString: string): string[] {
  const segments = splitCommandSegments(commandString);
  const commands: string[] = [];

  for (const segment of segments) {
    // Tokenize the segment
    const tokens = segment.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];

    for (const token of tokens) {
      const clean = token.replace(/^["']|["']$/g, "");

      // Skip variable assignments (FOO=bar)
      if (clean.includes("=") && !clean.startsWith("-")) continue;
      // Skip flags
      if (clean.startsWith("-")) continue;
      // Skip redirects
      if (/^[0-9]*[<>]/.test(clean)) continue;
      // Skip shell keywords and operators
      if (SHELL_KEYWORDS.has(clean) || SHELL_OPERATORS.has(clean)) continue;
      // Skip empty
      if (!clean) continue;

      // Extract basename for paths
      const basename = crossPlatformBasename(clean);
      commands.push(basename);
      break; // Only the first non-skip token is the command name
    }
  }

  return commands;
}

/**
 * Find the segment containing a specific command (for per-command validation).
 */
export function getCommandSegment(
  command: string,
  segments: string[],
): string | undefined {
  return segments.find((seg) => {
    const tokens = seg.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
    return tokens.some(
      (t) => crossPlatformBasename(t.replace(/^["']|["']$/g, "")) === command,
    );
  });
}
