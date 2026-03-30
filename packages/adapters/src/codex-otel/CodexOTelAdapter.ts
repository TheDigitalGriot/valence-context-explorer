/**
 * CodexOTelAdapter - Stub adapter for ingesting Codex OpenTelemetry spans.
 *
 * Extends BaseIngestionAdapter to discover and parse OTel span data
 * exported by OpenAI Codex sessions.
 */

import { BaseIngestionAdapter } from "../base/BaseIngestionAdapter";
import type {
	AdapterSource,
	NormalizedTrace,
	RawSession,
} from "../shared/types";

export class CodexOTelAdapter extends BaseIngestionAdapter {
	readonly name = "codex-otel";
	readonly source: AdapterSource = "codex-otel";

	/**
	 * Discover available Codex OTel sessions.
	 */
	async discover(): Promise<RawSession[]> {
		// TODO: Parse OpenTelemetry spans from Codex
		return [];
	}

	/**
	 * Parse a raw Codex OTel session into a NormalizedTrace.
	 */
	async parse(_session: RawSession): Promise<NormalizedTrace> {
		throw new Error("CodexOTelAdapter: not yet implemented");
	}
}
