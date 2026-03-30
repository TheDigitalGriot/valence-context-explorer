# Codex exposes completion notifications via notify.
# For per-prompt Start notifications and permission requests, watch the TUI
# session log for task_started/exec_command_begin and *_approval_request events.
if [ -n "$VALENCE_TAB_ID" ] && [ -f "{{NOTIFY_PATH}}" ]; then
  export CODEX_TUI_RECORD_SESSION=1
  if [ -z "$CODEX_TUI_SESSION_LOG_PATH" ]; then
    _valence_codex_ts="$(date +%s 2>/dev/null || echo "$$")"
    export CODEX_TUI_SESSION_LOG_PATH="${TMPDIR:-/tmp}/valence-codex-session-$$_${_valence_codex_ts}.jsonl"
  fi

  (
    _valence_log="$CODEX_TUI_SESSION_LOG_PATH"
    _valence_notify="{{NOTIFY_PATH}}"
    _valence_last_turn_id=""
    _valence_last_approval_id=""
    _valence_last_exec_call_id=""
    _valence_approval_fallback_seq=0

    _valence_emit_event() {
      _valence_event="$1"
      _valence_payload=$(printf '{"hook_event_name":"%s"}' "$_valence_event")
      bash "$_valence_notify" "$_valence_payload" >/dev/null 2>&1 || true
    }

    # Wait briefly for codex to create the session log.
    _valence_i=0
    while [ ! -f "$_valence_log" ] && [ "$_valence_i" -lt 200 ]; do
      _valence_i=$((_valence_i + 1))
      sleep 0.05
    done
    if [ ! -f "$_valence_log" ]; then
      exit 0
    fi

    tail -n 0 -F "$_valence_log" 2>/dev/null | while IFS= read -r _valence_line; do
      case "$_valence_line" in
        *'"dir":"to_tui"'*'"kind":"codex_event"'*'"msg":{"type":"task_started"'*)
          _valence_turn_id=$(printf '%s\n' "$_valence_line" | awk -F'"turn_id":"' 'NF > 1 { sub(/".*/, "", $2); print $2; exit }')
          [ -n "$_valence_turn_id" ] || _valence_turn_id="task_started"
          if [ "$_valence_turn_id" != "$_valence_last_turn_id" ]; then
            _valence_last_turn_id="$_valence_turn_id"
            _valence_emit_event "Start"
          fi
          ;;
        *'"dir":"to_tui"'*'"kind":"codex_event"'*'"msg":{"type":"'*'_approval_request"'*)
          _valence_approval_id=$(printf '%s\n' "$_valence_line" | awk -F'"id":"' 'NF > 1 { sub(/".*/, "", $2); print $2; exit }')
          [ -n "$_valence_approval_id" ] || _valence_approval_id=$(printf '%s\n' "$_valence_line" | awk -F'"approval_id":"' 'NF > 1 { sub(/".*/, "", $2); print $2; exit }')
          [ -n "$_valence_approval_id" ] || _valence_approval_id=$(printf '%s\n' "$_valence_line" | awk -F'"call_id":"' 'NF > 1 { sub(/".*/, "", $2); print $2; exit }')
          if [ -z "$_valence_approval_id" ]; then
            _valence_approval_fallback_seq=$((_valence_approval_fallback_seq + 1))
            _valence_approval_id="approval_request_${_valence_approval_fallback_seq}"
          fi
          if [ "$_valence_approval_id" != "$_valence_last_approval_id" ]; then
            _valence_last_approval_id="$_valence_approval_id"
            _valence_emit_event "PermissionRequest"
          fi
          ;;
        *'"dir":"to_tui"'*'"kind":"codex_event"'*'"msg":{"type":"exec_command_begin"'*)
          _valence_exec_call_id=$(printf '%s\n' "$_valence_line" | awk -F'"call_id":"' 'NF > 1 { sub(/".*/, "", $2); print $2; exit }')
          if [ -n "$_valence_exec_call_id" ]; then
            if [ "$_valence_exec_call_id" != "$_valence_last_exec_call_id" ]; then
              _valence_last_exec_call_id="$_valence_exec_call_id"
              _valence_emit_event "Start"
            fi
          else
            _valence_emit_event "Start"
          fi
          ;;
      esac
    done
  ) &
  VALENCE_CODEX_START_WATCHER_PID=$!
fi

"$REAL_BIN" --enable codex_hooks -c 'notify=["bash","{{NOTIFY_PATH}}"]' "$@"
VALENCE_CODEX_STATUS=$?

if [ -n "$VALENCE_CODEX_START_WATCHER_PID" ]; then
  kill "$VALENCE_CODEX_START_WATCHER_PID" >/dev/null 2>&1 || true
  wait "$VALENCE_CODEX_START_WATCHER_PID" 2>/dev/null || true
fi

exit "$VALENCE_CODEX_STATUS"
