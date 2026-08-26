# Task Handler Instructions

This file is the operational procedure for any agent working on a task. Read it together with `README.md`, `tasks/creator.md`, `tasks/init.md`, and the assigned task file before editing.

## Planner approval gate

If no task is available and the user requests substantial new work, do not implement it directly. Enter planner mode and provide a summary of the objective, success criteria, scope, task breakdown, dependencies, tests, and assumptions. Ask:

```text
Approve creating these tasks and implementing the plan?
```

Before a clear `yes`, `approve`, or `proceed`, do not create task files, modify the board, claim a task, or edit source files. After approval, create the full task group—including the implementation tasks, `tasks/README.md`, and `tasks/TASK-999-finalize.md`—with unchecked granular checklists, then claim the highest-priority task. A small explicitly requested edit may bypass task generation; substantial feature or service work may not.

## Parallel background agents

After explicit approval, `make tasks-run` runs `tasks/scripts/run-task-agents.sh` and may launch one background `codex exec` process per incomplete task, spacing process creation by approximately one second (`TASK_AGENT_DELAY` overrides the default). These processes are coordinated by task claims, not launch order:

- The first process whose atomic claim-directory creation succeeds owns the task.
- A process that finds an existing claim exits without editing.
- Dependent processes claim their own tasks and remain in persistent polling.
- The finalizer may launch immediately and must wait for all dependencies.
- Each process writes output to its task log and records its PID under `tasks/runner/`.

Rerunning the launcher is safe for complete or already-claimed tasks because they are skipped. Do not manually edit another agent’s claim or kill a process without verifying the PID and owner record.

## 1. Inspect before acting

1. Read the assigned task completely.
2. Read every dependency task and check its exact completion marker:

   ```markdown
   - [x] Done with implementation and testing
   ```

3. Read the assigned task’s granular implementation, test, and documentation checkboxes.
4. Inspect `tasks/claims/` for ownership.

Checked granular items are preserved progress. Start with the first unchecked item; do not redo checked work unless verification shows it is invalid.

## 2. Claim ownership atomically

Before changing implementation files, create the task claim directory as the ownership lock:

```bash
mkdir tasks/claims/TASK-NNN
```

Only the invocation whose `mkdir` succeeds owns the task. Immediately write `owner.md` with:

```text
agent_id: <unique invocation ID>
task_id: TASK-NNN
hostname: <hostname>
terminal: <terminal>
start_time: <timestamp>
last_heartbeat: <timestamp>
status: claimed
progress: <first unchecked item>
```

If the directory already exists, do not edit the task, rewrite `owner.md`, or assume ownership from matching hostname, terminal, or agent ID. Inspect another unclaimed task.

## 3. Wait persistently for dependencies

If dependencies are incomplete:

1. Change the claim status to `waiting` and set `progress` to the dependency names.
2. Keep the Codex session active.
3. Re-read every dependency and update `last_heartbeat` every 15 seconds.
4. Begin immediately when all dependencies contain the exact checked completion marker.

Use a persistent loop or equivalent active session. Do not check once and exit, and do not report an unfinished dependency as a blocker.

Waiting is allowed even when another agent owns the dependency. It prevents duplicate work while allowing the current task to be ready immediately when the dependency completes.

## 4. Track granular progress

For each implementation, test, or documentation item:

1. Work only within the assigned task’s scope.
2. Run the relevant check or test.
3. Change that item’s checkbox to `[x]` only after it passes.
4. Update the claim heartbeat and `progress` field.

Leave unfinished items unchecked so a recovery agent can see exactly what remains. Do not check the final completion marker early.

## 5. Recover an interrupted task safely

A claim may be recovered only when all of the following are true:

- The claim status is not `complete`.
- `last_heartbeat` is older than 30 minutes.
- The original owner has been verified inactive; matching metadata alone is not enough.
- A recovery lock is acquired atomically before changing ownership.

Preserve the old `owner.md`, record the recovery evidence, create a new unique agent ID, and continue from the first unchecked task item. Never recover an active or fresh claim.

## 6. Complete and finalize

For a normal task:

1. Run all required tests.
2. Check each granular implementation/test/documentation item.
3. Check `Done with implementation and testing` last.
4. Mark the claim `complete` and release only that claim.
5. Re-read the board. If all implementation tasks are complete, claim and run `TASK-999-finalize.md` in the same session when possible.

For the finalizer:

- Poll until every dependency is complete.
- Reconcile completed task rows to `Complete`.
- Run the full test suite.
- Verify explicit task and claim targets.
- Delete only the temporary task files, board, and verified task-group claims.
- Preserve `tasks/creator.md`, `tasks/task-handler.md`, `tasks/init.md`, and root `AGENTS.md`.
- Never recursively delete the `tasks/` directory.

If tests fail or a dependency is incomplete, delete nothing.

## 7. Reporting

Report the claim, current progress, tests run, and remaining unchecked items. A waiting agent reports that it is polling and remains active; it does not return a final blocked response.
