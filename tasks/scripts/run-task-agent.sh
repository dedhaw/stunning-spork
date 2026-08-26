#!/usr/bin/env bash

set -euo pipefail

if (( $# != 3 )); then
  echo "Usage: $0 TASK_FILE LOG_FILE PID_FILE" >&2
  exit 2
fi

task_file="$1"
log_file="$2"
pid_file="$3"
CODEX_BIN="${CODEX_BIN:-codex}"

mkdir -p "$(dirname "$log_file")" "$(dirname "$pid_file")"
printf '%s\n' "$$" >"$pid_file"

prompt="Read README.md, tasks/creator.md, tasks/init.md, tasks/task-handler.md, and $task_file. Implement $task_file only. Use the task-handler procedure: atomically claim the task before editing, preserve granular progress checkboxes, poll dependencies persistently, and never take over an existing claim. If another process wins the claim, exit without modifying the task or source files. Run the required tests and follow the completion protocol."

exec "$CODEX_BIN" exec "$prompt" >>"$log_file" 2>&1
