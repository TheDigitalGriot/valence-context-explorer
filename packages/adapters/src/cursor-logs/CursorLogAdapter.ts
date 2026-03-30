/**
 * CursorLogAdapter - Stub adapter for ingesting Cursor AI session logs.
 *
 * Extends BaseIngestionAdapter to discover and parse log data
 * from Cursor AI coding sessions.
 */

import { BaseIngestionAdapter } from "../base/BaseIngestionAdapter";
import type {
	AdapterSource,
	NormalizedTrace,
	RawSession,
} from "../shared/types";

export class CursorLogAdapter extends BaseIngestionAdapter {
	readonly name = "cursor-logs";
	readonly source: AdapterSource = "cursor-logs";

	/**
	 * Discover available Cursor AI session logs.
	 */
	async discover(): Promise<RawSession[]> {
		// TODO: Discover Cursor AI session logs
		return [];
	}

	/**
	 * Parse a raw Cursor log session into a NormalizedTrace.
	 */
	async parse(_session: RawSession): Promise<NormalizedTrace> {
		throw new Error("CursorLogAdapter: not yet implemented");
	}
}
