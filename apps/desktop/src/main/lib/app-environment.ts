import { chmodSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { VALENCE_DIR_NAME } from "shared/constants";

const VALENCE_HOME_DIR_ENV = "VALENCE_HOME_DIR";

export const VALENCE_HOME_DIR =
	process.env[VALENCE_HOME_DIR_ENV] || join(homedir(), VALENCE_DIR_NAME);
process.env[VALENCE_HOME_DIR_ENV] = VALENCE_HOME_DIR;

export const VALENCE_HOME_DIR_MODE = 0o700;
export const VALENCE_SENSITIVE_FILE_MODE = 0o600;

export function ensureValenceHomeDirExists(): void {
	if (!existsSync(VALENCE_HOME_DIR)) {
		mkdirSync(VALENCE_HOME_DIR, {
			recursive: true,
			mode: VALENCE_HOME_DIR_MODE,
		});
	}

	// Best-effort repair if the directory already existed with weak permissions.
	try {
		chmodSync(VALENCE_HOME_DIR, VALENCE_HOME_DIR_MODE);
	} catch (error) {
		console.warn(
			"[app-environment] Failed to chmod Valence home dir (best-effort):",
			VALENCE_HOME_DIR,
			error,
		);
	}
}

// For lowdb - use our own path instead of app.getPath("userData")
export const APP_STATE_PATH = join(VALENCE_HOME_DIR, "app-state.json");

// Window geometry state (separate from UI state - main process only, sync I/O)
export const WINDOW_STATE_PATH = join(VALENCE_HOME_DIR, "window-state.json");
