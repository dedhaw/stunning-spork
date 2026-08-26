#!/usr/bin/env bash

set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fixture_dir="$(mktemp -d "${TMPDIR:-/tmp}/task-agents-test.XXXXXX")"
trap 'rm -rf "$fixture_dir"' EXIT

mkdir -p "$fixture_dir/tasks/claims"
cat >"$fixture_dir/tasks/TASK-001-first.md" <<'EOF'
# TASK-001

- [ ] Done with implementation and testing
EOF
cat >"$fixture_dir/tasks/TASK-002-second.md" <<'EOF'
# TASK-002

- [ ] Done with implementation and testing
EOF
cat >"$fixture_dir/tasks/TASK-003-complete.md" <<'EOF'
# TASK-003

- [x] Done with implementation and testing
EOF
mkdir "$fixture_dir/tasks/claims/TASK-004-claimed"
cat >"$fixture_dir/tasks/TASK-004-claimed.md" <<'EOF'
# TASK-004

- [ ] Done with implementation and testing
EOF

fake_codex="$fixture_dir/fake-codex"
fake_terminal="$fixture_dir/fake-terminal"
record_file="$fixture_dir/invocations"
cat >"$fake_codex" <<'EOF'
#!/usr/bin/env bash
printf '%s %s\n' "$(date +%s)" "$*" >>"$FAKE_CODEX_RECORD"
exit 0
EOF
chmod +x "$fake_codex"
cat >"$fake_terminal" <<'EOF'
#!/usr/bin/env bash
printf '%s %s\n' "$(date +%s)" "$2" >>"$FAKE_TERMINAL_RECORD"
"$1" "$2" "$3" "$4" &
exit 0
EOF
chmod +x "$fake_terminal"

TASK_DIR="$fixture_dir/tasks" \
TASK_LOG_DIR="$fixture_dir/logs" \
TASK_RUN_DIR="$fixture_dir/runner" \
CODEX_BIN="$fake_codex" \
FAKE_CODEX_RECORD="$record_file" \
TERMINAL_LAUNCHER="$fake_terminal" \
FAKE_TERMINAL_RECORD="$fixture_dir/terminal-launches" \
TASK_AGENT_DELAY=1 \
  "$repo_dir/tasks/scripts/run-task-agents.sh" >"$fixture_dir/launcher-output"

for _ in {1..30}; do
  [[ -f "$fixture_dir/runner/TASK-001-first.pid" && -f "$fixture_dir/runner/TASK-002-second.pid" ]] && break
  sleep 0.1
done

[[ "$(wc -l <"$record_file" | tr -d ' ')" == 2 ]]
first_launch="$(sed -n '1s/ .*//p' "$fixture_dir/terminal-launches")"
second_launch="$(sed -n '2s/ .*//p' "$fixture_dir/terminal-launches")"
(( second_launch - first_launch >= 1 ))
grep -Fq 'tasks/TASK-001-first.md' "$record_file"
grep -Fq 'tasks/TASK-002-second.md' "$record_file"
[[ -f "$fixture_dir/logs/TASK-001-first.log" ]]
[[ -f "$fixture_dir/logs/TASK-002-second.log" ]]
[[ -f "$fixture_dir/runner/TASK-001-first.pid" ]]
[[ -f "$fixture_dir/runner/TASK-002-second.pid" ]]
grep -Fq 'TASK-003-complete: complete; skipped' "$fixture_dir/launcher-output"
grep -Fq 'TASK-004-claimed: already claimed; skipped' "$fixture_dir/launcher-output"

echo "task-agent launcher test passed"
