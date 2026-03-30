# External Files Written by Valence Desktop

This document lists all files written by the Valence desktop app outside of user projects.
Understanding these files is critical for maintaining workspace isolation and avoiding conflicts.

## Workspace-Specific Directories

The app uses different home directories based on workspace:
- **Default**: `~/.valence/`
- **Named workspace**: `~/.valence-{workspace}/` (e.g. `~/.valence-my-feature/`)

This separation prevents multiple instances from interfering with each other.

## Files in `~/.valence[-{workspace}]/`

### `bin/` - Agent Wrapper Scripts

| File | Purpose |
|------|---------|
| `claude` | Wrapper for Claude Code CLI that injects notification hooks |
| `codex` | Wrapper for Codex CLI that injects notification hooks |
| `droid` | Wrapper for Factory Droid CLI that preserves Valence hook integration |
| `opencode` | Wrapper for OpenCode CLI that sets `OPENCODE_CONFIG_DIR` |

These wrappers are added to `PATH` via shell integration, allowing them to intercept
agent commands and inject Valence-specific configuration.

### `hooks/` - Notification Hook Scripts

| File | Purpose |
|------|---------|
| `notify.sh` | Shell script called by agents when they complete or need input |
| `claude-settings.json` | Claude Code settings file with hook configuration |
| `opencode/plugin/valence-notify.js` | OpenCode plugin for lifecycle events |

## Global Tool Settings Files

Some CLIs only support global user settings for hook registration. Valence merges
its hook entries into these files while preserving user-defined entries:

| File | Purpose |
|------|---------|
| `~/.claude/settings.json` | Claude Code hook registration merge |
| `~/.codex/hooks.json` | Codex fallback hook registration merge (`SessionStart`, `Stop`) |
| `~/.factory/settings.json` | Factory Droid hook registration (`UserPromptSubmit`, `Notification`, `PostToolUse`, `Stop`) |

For Codex specifically, this global `hooks.json` is a fallback path only. The
primary Valence integration is the wrapper in `~/.valence[-{workspace}]/bin/codex`,
which injects `notify` and watches the Codex session log for richer lifecycle
events without mutating project-local `.codex/` state.

### `zsh/` and `bash/` - Shell Integration

| File | Purpose |
|------|---------|
| `init.zsh` | Zsh initialization script (sources .zshrc, sets up PATH) |
| `init.bash` | Bash initialization script (sources .bashrc, sets up PATH) |

Shell integration keeps interactive startup close to native shell behavior:
- Interactive startup applies idempotent PATH prepend only (no persistent command interception functions).
- App-owned non-interactive `-c` command execution still routes managed binaries through absolute Valence wrapper paths.

## Global Files (AVOID ADDING NEW ONES)

**DO NOT write to global locations** like `~/.config/`, `~/Library/`, etc.
These cause dev/prod conflicts when both environments are running.

### Known Issues with Global Files

Previously, the OpenCode plugin was written to `~/.config/opencode/plugin/valence-notify.js`.
This caused severe issues:
1. Dev would overwrite prod's plugin with incompatible protocol
2. Prod terminals would send events that dev's server couldn't handle
3. Users received spam notifications for every agent message

**Solution**: The global plugin is no longer written. On startup, any stale global plugin
with our marker is deleted to prevent conflicts from older versions.

## Shell RC File Modifications

The app modifies shell RC files to add the Valence bin directory to PATH:

| Shell | RC File | Modification |
|-------|---------|--------------|
| Zsh | `~/.zshrc` | Prepends `~/.valence[-{workspace}]/bin` to PATH |
| Bash | `~/.bashrc` | Prepends `~/.valence[-{workspace}]/bin` to PATH |

## Terminal Environment Variables

Each terminal session receives these environment variables:

| Variable | Purpose |
|----------|---------|
| `VALENCE_PANE_ID` | Unique identifier for the terminal pane |
| `VALENCE_TAB_ID` | Identifier for the containing tab |
| `VALENCE_WORKSPACE_ID` | Identifier for the workspace |
| `VALENCE_WORKSPACE_NAME` | Human-readable workspace name |
| `VALENCE_WORKSPACE_PATH` | Filesystem path to the workspace |
| `VALENCE_ROOT_PATH` | Root path of the project |
| `VALENCE_PORT` | Port for the notification server |
| `VALENCE_ENV` | Environment (`development` or `production`) |
| `VALENCE_HOOK_VERSION` | Hook protocol version for compatibility |

## Adding New External Files

Before adding new files outside of `~/.valence[-{workspace}]/`:

1. **Consider if it's necessary** - Can you use the environment-specific directory instead?
2. **Check for conflicts** - Will dev and prod overwrite each other?
3. **Update this document** - Add the file to the appropriate section
4. **Add cleanup logic** - If migrating from global to local, clean up the old location

## Debugging Cross-Environment Issues

If you suspect dev/prod cross-talk:

1. Check logs for "Environment mismatch" warnings
2. Verify `VALENCE_ENV` and `VALENCE_PORT` are set correctly in terminal
3. Delete stale global files: `rm -rf ~/.config/opencode/plugin/valence-notify.js`
4. Restart both dev and prod apps to regenerate hooks
