import type { HookInputData, SecurityScanResult, ValidationResult, ValidatorFunction } from "./types";
import { extractCommands, splitCommandSegments, getCommandSegment } from "./command-parser";
import { isCommandBlocked } from "./denylist";
import { validateToolInput } from "./tool-input-validator";

// Dangerous rm targets
const DANGEROUS_RM_TARGETS = new Set([
  "/", "~", "/home", "/usr", "/etc", "/var", "/opt", "/bin",
  "/sbin", "/lib", "/tmp", "/boot", "/root", "/dev", "/proc", "/sys",
]);

// System-critical processes that must not be killed
const BLOCKED_PROCESS_NAMES = new Set([
  "systemd", "launchd", "init", "kernel", "sshd", "dbus",
  "Finder", "Dock", "WindowServer", "loginwindow", "electron",
  "explorer.exe", "csrss.exe", "winlogon.exe", "dwm.exe",
]);

// Git config keys that must not be modified
const BLOCKED_GIT_CONFIG_KEYS = new Set([
  "user.name", "user.email", "author.name", "author.email",
  "committer.name", "committer.email",
]);

function validateRmCommand(_cmd: string, segment: string): ValidationResult {
  if (/--no-preserve-root/.test(segment)) {
    return [false, "rm with --no-preserve-root is blocked"];
  }
  const tokens = segment.split(/\s+/);
  for (const token of tokens) {
    const cleaned = token.replace(/["']/g, "").replace(/\/+$/, "");
    if (DANGEROUS_RM_TARGETS.has(cleaned)) {
      return [false, `rm targeting '${cleaned}' is blocked (system-critical path)`];
    }
  }
  return [true, ""];
}

function validateGitCommand(_cmd: string, segment: string): ValidationResult {
  // Check git -c key=value inline config
  const inlineMatch = segment.match(/-c\s+["']?(\S+?)=/);
  if (inlineMatch) {
    const key = inlineMatch[1].toLowerCase();
    if (BLOCKED_GIT_CONFIG_KEYS.has(key)) {
      return [false, `Modifying git config '${key}' is blocked`];
    }
  }
  // Check git config <key> subcommand
  const configMatch = segment.match(/git\s+config\s+(?:--global\s+)?["']?(\S+)/);
  if (configMatch) {
    const key = configMatch[1].toLowerCase();
    if (BLOCKED_GIT_CONFIG_KEYS.has(key)) {
      return [false, `Modifying git config '${key}' is blocked`];
    }
  }
  return [true, ""];
}

function validateProcessKill(_cmd: string, segment: string): ValidationResult {
  const tokens = segment.split(/\s+/);
  for (const token of tokens) {
    const cleaned = token.replace(/["']/g, "");
    if (BLOCKED_PROCESS_NAMES.has(cleaned)) {
      return [false, `Killing process '${cleaned}' is blocked (system-critical)`];
    }
  }
  // Block pkill -u (kill by user — too broad)
  if (/-u\b/.test(segment)) {
    return [false, "pkill -u (kill by user) is blocked — too broad"];
  }
  return [true, ""];
}

function validateChmodCommand(_cmd: string, segment: string): ValidationResult {
  // Block setuid/setgid bits
  if (/[46][0-7]{3}/.test(segment) || /\+s\b/.test(segment)) {
    return [false, "chmod with setuid/setgid bits is blocked"];
  }
  return [true, ""];
}

function validateShellCCommand(_cmd: string, segment: string): ValidationResult {
  // Extract inner command from bash -c "..."
  const match = segment.match(/(?:bash|sh|zsh)\s+(?:-[a-z]*c[a-z]*)\s+["'](.+?)["']\s*$/);
  if (!match) return [true, ""];

  const innerCommands = extractCommands(match[1]);
  for (const inner of innerCommands) {
    const [allowed, reason] = isCommandBlocked(inner);
    if (!allowed) {
      return [false, `Nested command blocked: ${reason}`];
    }
  }
  return [true, ""];
}

function validateDatabaseCommand(_cmd: string, segment: string): ValidationResult {
  const destructive = /DROP\s+(?:DATABASE|TABLE)|TRUNCATE|DELETE\s+FROM\s+[^\s]+\s*;/i;
  if (destructive.test(segment)) {
    return [false, "Destructive database operation blocked"];
  }
  return [true, ""];
}

const VALIDATORS: Record<string, ValidatorFunction> = {
  rm: validateRmCommand,
  chmod: validateChmodCommand,
  git: validateGitCommand,
  pkill: validateProcessKill,
  kill: validateProcessKill,
  killall: validateProcessKill,
  bash: validateShellCCommand,
  sh: validateShellCCommand,
  zsh: validateShellCCommand,
  psql: validateDatabaseCommand,
  mysql: validateDatabaseCommand,
  mongosh: validateDatabaseCommand,
};

/**
 * Main security enforcement hook. Call this on every tool use event.
 * Returns an allow/block decision with a reason.
 */
export function bashSecurityHook(inputData: HookInputData): SecurityScanResult {
  // Only validate Bash tool calls
  if (inputData.toolName !== "Bash") {
    return { allowed: true, reason: "Non-Bash tool — allowed" };
  }

  // Validate tool input shape
  const [inputValid, inputReason] = validateToolInput(
    inputData.toolName,
    inputData.toolInput,
  );
  if (!inputValid) {
    return { allowed: false, reason: inputReason };
  }

  const command = String(inputData.toolInput?.command ?? "");
  if (!command.trim()) {
    return { allowed: false, reason: "Empty command" };
  }

  const commandNames = extractCommands(command);
  const segments = splitCommandSegments(command);

  for (const cmd of commandNames) {
    // Step 1: Check static denylist
    const [allowed, blockReason] = isCommandBlocked(cmd);
    if (!allowed) {
      return {
        allowed: false,
        reason: blockReason,
        blockedCommand: cmd,
        validator: "denylist",
      };
    }

    // Step 2: Check per-command validators
    const validator = VALIDATORS[cmd];
    if (validator) {
      const segment = getCommandSegment(cmd, segments) ?? command;
      const [cmdAllowed, cmdReason] = validator(cmd, segment);
      if (!cmdAllowed) {
        return {
          allowed: false,
          reason: cmdReason,
          blockedCommand: cmd,
          validator: cmd,
        };
      }
    }
  }

  return { allowed: true, reason: "All commands allowed" };
}
