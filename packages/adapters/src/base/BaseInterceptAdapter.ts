import type {
	AdapterSource,
	HookConfig,
	NormalizedEvent,
	RawEvent,
} from "../shared/types";

/**
 * Active adapter: intercepts execution in real-time (hooks, callbacks).
 * Inspired by Composio's BaseAgenticProvider pattern —
 * receives events during execution rather than reading after the fact.
 */
export abstract class BaseInterceptAdapter {
	/** Unique adapter name (e.g., "claude-code-hooks", "agent-sdk-callback") */
	abstract readonly name: string;

	/** Source type for this adapter */
	abstract readonly source: AdapterSource;

	/** Whether this adapter is currently listening */
	protected _listening = false;

	get isListening(): boolean {
		return this._listening;
	}

	/**
	 * Normalize a raw event into the canonical format.
	 * Called for each incoming event from the real-time source.
	 */
	abstract onEvent(event: RawEvent): NormalizedEvent;

	/**
	 * Start listening for events.
	 * @param handler - callback invoked for each normalized event
	 */
	abstract startListening(handler: (event: NormalizedEvent) => void): void;

	/**
	 * Stop listening for events.
	 */
	abstract stopListening(): void;

	/**
	 * Optional: Return hook configuration for installation.
	 * For hook-based adapters, this returns the hook scripts/config needed.
	 */
	registerHooks?(): HookConfig;

	/**
	 * Health check — is this adapter's event source reachable?
	 */
	abstract healthCheck(): Promise<boolean>;
}
