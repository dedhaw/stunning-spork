#!/usr/bin/env bash

set -u

TASK_DIR="${TASK_DIR:-tasks}"
LOG_DIR="${TASK_LOG_DIR:-$TASK_DIR/logs}"
RUN_DIR="${TASK_RUN_DIR:-$TASK_DIR/runner}"
CODEX_BIN="${CODEX_BIN:-codex}"
AGENT_DELAY="${TASK_AGENT_DELAY:-1}"

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

  prompt="Read README.md, tasks/creator.md, tasks/init.md, tasks/task-handler.md, and $task_file. Implement $task_file only. Use the task-handler procedure: atomically claim the task before editing, preserve granular progress checkboxes, poll dependencies persistently, and never take over an existing claim. If another process wins the claim, exit without modifying the task or source files. Run the required tests and follow the completion protocol."

  if (( started > 0 )); then
    sleep "$AGENT_DELAY"
  fi

  echo "$task_name: launching; log=$log_file"
  "$CODEX_BIN" exec "$prompt" >"$log_file" 2>&1 &
  pid=$!
  printf '%s\n' "$pid" >"$pid_file"
  started=$((started + 1))
done

echo "Started $started agent(s); skipped $skipped task(s)."
echo "Logs: $LOG_DIR"
echo "PIDs: $RUN_DIR"
