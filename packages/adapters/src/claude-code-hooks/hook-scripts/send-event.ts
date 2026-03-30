#!/usr/bin/env bun
/**
 * Unified hook event sender for Valence.
 *
 * Usage:
 *   bun send-event.ts --event-type <type> --session-id <id> [--payload <json>]
 *
 * Reads hook payload from stdin (Claude Code pipes it) or from --payload flag,
 * then sends it to Valence's local HookEventServer.
 *
 * Environment variables:
 *   VALENCE_EVENT_URL  - Override the event server URL (default: http://127.0.0.1:4100/events)
 *   CLAUDE_SESSION_ID  - Fallback session ID if --session-id is not provided
 */

const VALENCE_EVENT_URL =
	process.env.VALENCE_EVENT_URL || "http://127.0.0.1:4100/events";

async function main() {
	const args = process.argv.slice(2);

	const eventType = getArg(args, "--event-type") || "unknown";
	const sessionId =
		getArg(args, "--session-id") ||
		process.env.CLAUDE_SESSION_ID ||
		"unknown";

	let payload: Record<string, unknown> = {};
	const payloadArg = getArg(args, "--payload");
	if (payloadArg) {
		payload = JSON.parse(payloadArg);
	} else {
		// Read from stdin (Claude Code pipes the hook payload as JSON)
		const stdin = await Bun.stdin.text();
		if (stdin.trim()) {
			try {
				payload = JSON.parse(stdin);
			} catch {
				payload = { raw: stdin };
			}
		}
	}

	const event = {
		session_id: sessionId,
		hook_event_type: eventType,
		payload,
		timestamp: Date.now(),
		source_app: "valence",
	};

	try {
		await fetch(VALENCE_EVENT_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(event),
		});
	} catch {
		// Silently fail - never block Claude Code
	}
}

function getArg(args: string[], flag: string): string | undefined {
	const idx = args.indexOf(flag);
	return idx !== -1 ? args[idx + 1] : undefined;
}

main();
