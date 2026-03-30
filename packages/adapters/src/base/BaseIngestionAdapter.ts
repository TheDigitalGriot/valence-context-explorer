import type { AdapterSource, NormalizedTrace, RawSession } from "../shared/types";

/**
 * Passive adapter: reads data after the fact (logs, files, OTel).
 * Inspired by Composio's BaseNonAgenticProvider pattern.
 */
export abstract class BaseIngestionAdapter {
	/** Unique adapter name (e.g., "claude-code-logs", "codex-otel") */
	abstract readonly name: string;

	/** Source type for this adapter */
	abstract readonly source: AdapterSource;

	/** Whether this adapter is currently active/watching */
	protected _active = false;

	get isActive(): boolean {
		return this._active;
	}

	/**
	 * Discover available sessions/traces from the data source.
	 * Like Composio's wrapTools() — discovers what's available.
	 */
	abstract discover(): Promise<RawSession[]>;

	/**
	 * Parse a raw session into a normalized trace.
	 * Like Composio's wrapTool() — transforms from source format to canonical format.
	 */
	abstract parse(session: RawSession): Promise<NormalizedTrace>;

	/**
	 * Optional: Watch the data source for changes and invoke callback.
	 * Not all ingestion adapters support watching (e.g., one-shot OTel import wouldn't).
	 */
	watch?(onChange: (sessions: RawSession[]) => void): void;

	/**
	 * Stop watching if active.
	 */
	stop?(): void;

	/**
	 * Health check — can this adapter reach its data source?
	 */
	async healthCheck(): Promise<boolean> {
		try {
			await this.discover();
			return true;
		} catch {
			return false;
		}
	}
}
