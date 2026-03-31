import type { ValidationResult } from "./types";

/**
 * Commands that are ALWAYS blocked regardless of context.
 * Ported from Aperant's denylist-based security model.
 */
export const BLOCKED_COMMANDS = new Set([
  // System shutdown / reboot
  "shutdown",
  "reboot",
  "halt",
  "poweroff",
  "init",
  // Disk destruction
  "mkfs",
  "fdisk",
  "parted",
  "gdisk",
  "dd",
  // Privilege escalation
  "sudo",
  "su",
  "doas",
  "chown",
  // Firewall manipulation
  "iptables",
  "ip6tables",
  "nft",
  "ufw",
  // Network scanning
  "nmap",
  // Service management
  "systemctl",
  "service",
  // Scheduled tasks
  "crontab",
  // Mount operations
  "mount",
  "umount",
  // User management
  "useradd",
  "userdel",
  "usermod",
  "groupadd",
  "groupdel",
  "passwd",
  "visudo",
]);

export function isCommandBlocked(command: string): ValidationResult {
  const cmd = command.toLowerCase().trim();
  if (BLOCKED_COMMANDS.has(cmd)) {
    return [false, `Command '${cmd}' is blocked (system-critical operation)`];
  }
  return [true, ""];
}
