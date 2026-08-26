#!/usr/bin/env bash

set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TASK_DIR="${TASK_DIR:-tasks}"
[[ "$TASK_DIR" = /* ]] || TASK_DIR="$repo_dir/$TASK_DIR"
LOG_DIR="${TASK_LOG_DIR:-$TASK_DIR/logs}"
RUN_DIR="${TASK_RUN_DIR:-$TASK_DIR/runner}"
CODEX_BIN="${CODEX_BIN:-codex}"
AGENT_DELAY="${TASK_AGENT_DELAY:-1}"
TERMINAL_AUTOMATION_BIN="${TERMINAL_AUTOMATION_BIN:-osascript}"
TERMINAL_LAUNCHER="${TERMINAL_LAUNCHER:-}"
worker_script="$repo_dir/tasks/scripts/run-task-agent.sh"

if [[ ! -d "$TASK_DIR" ]]; then
  echo "No task directory found: $TASK_DIR" >&2
  exit 1
fi

mkdir -p "$LOG_DIR" "$RUN_DIR"

shopt -s nullglob
task_files=("$TASK_DIR"/TASK-*.md)
shopt -u nullglob

if (( ${#task_files[@]} == 0 )); then
  echo "No task files found."
  exit 0
fi

if [[ -n "$TERMINAL_LAUNCHER" ]]; then
  if [[ ! -x "$TERMINAL_LAUNCHER" ]]; then
    echo "Terminal launcher not found or not executable: $TERMINAL_LAUNCHER" >&2
    exit 1
  fi
elif ! command -v "$TERMINAL_AUTOMATION_BIN" >/dev/null 2>&1; then
  echo "Terminal automation executable not found in PATH: $TERMINAL_AUTOMATION_BIN" >&2
  exit 1
fi

started=0
skipped=0

for task_file in "${task_files[@]}"; do
  task_name="$(basename "$task_file" .md)"
  claim_dir="$TASK_DIR/claims/$task_name"
  log_file="$LOG_DIR/$task_name.log"
  pid_file="$RUN_DIR/$task_name.pid"

  if grep -Fq -- '- [x] Done with implementation and testing' "$task_file"; then
    echo "$task_name: complete; skipped"
    skipped=$((skipped + 1))
    continue
  fi

  if [[ -d "$claim_dir" ]]; then
    echo "$task_name: already claimed; skipped"
    skipped=$((skipped + 1))
    continue
  fi

  if (( started > 0 )); then
    sleep "$AGENT_DELAY"
  fi

  echo "$task_name: launching; log=$log_file"
  if [[ -n "$TERMINAL_LAUNCHER" ]]; then
    "$TERMINAL_LAUNCHER" "$worker_script" "$task_file" "$log_file" "$pid_file"
  else
    printf -v terminal_command 'cd %q && exec %q %q %q %q' \
      "$repo_dir" "$worker_script" "$task_file" "$log_file" "$pid_file"
    terminal_command=${terminal_command//\\/\\\\}
    terminal_command=${terminal_command//\"/\\\"}
    "$TERMINAL_AUTOMATION_BIN" -e "tell application \"Terminal\" to do script \"$terminal_command\""
  fi
  started=$((started + 1))
done

echo "Started $started agent(s); skipped $skipped task(s)."
echo "Logs: $LOG_DIR"
echo "PIDs: $RUN_DIR"
