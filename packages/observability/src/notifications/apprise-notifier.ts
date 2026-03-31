import { execFile } from "child_process";
import { promisify } from "util";
import type { NotifierConfig, NotificationPayload } from "./types";

const execFileAsync = promisify(execFile);

/**
 * Discover Apprise notification URLs from environment variables.
 * Convention: NOTIFY_SLACK=slack://..., NOTIFY_DISCORD=discord://..., etc.
 * Also supports NOTIFY_URLS as a comma-separated catch-all.
 */
export function discoverNotifyUrls(): string[] {
  const urls: string[] = [];

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("NOTIFY_") && key !== "NOTIFY_URLS" && value) {
      urls.push(value);
    }
  }

  const catchAll = process.env.NOTIFY_URLS;
  if (catchAll) {
    urls.push(...catchAll.split(",").map((u) => u.trim()).filter(Boolean));
  }

  return urls;
}

/**
 * Check if the Apprise CLI is available.
 */
async function isAppriseAvailable(): Promise<boolean> {
  try {
    await execFileAsync("apprise", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Send a notification via Apprise CLI.
 * Gracefully no-ops if Apprise is not installed or URLs are empty.
 */
export async function sendNotification(
  config: NotifierConfig,
  payload: NotificationPayload,
): Promise<{ sent: boolean; error?: string }> {
  if (!config.enabled || config.urls.length === 0) {
    return { sent: false, error: "Notifications disabled or no URLs configured" };
  }

  const available = await isAppriseAvailable();
  if (!available) {
    return { sent: false, error: "Apprise CLI not installed (pip install apprise)" };
  }

  try {
    const args = [
      "--title", payload.title,
      "--body", payload.body,
      ...config.urls,
    ];

    if (payload.tags?.length) {
      args.push("--tag", payload.tags.join(","));
    }

    await execFileAsync("apprise", args, { timeout: 15_000 });
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { sent: false, error: `Apprise send failed: ${message}` };
  }
}

/**
 * Create a NotifierConfig from environment.
 */
export function createNotifierConfig(): NotifierConfig {
  const urls = discoverNotifyUrls();
  return {
    urls,
    enabled: urls.length > 0,
  };
}

/**
 * Event-to-title mapping for standard Valence events.
 */
export function getDefaultTitle(event: NotificationPayload["event"]): string {
  const titles: Record<string, string> = {
    "session.complete": "Session Complete",
    "session.error": "Session Error",
    "intervention.required": "Intervention Required",
    "cost.threshold": "Cost Threshold Reached",
    "report.ready": "Report Ready",
    custom: "Valence Notification",
  };
  return titles[event] ?? "Valence Notification";
}
