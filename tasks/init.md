# Codex Task Initialization Protocol

This is the startup protocol for an unassigned Codex session. Read the root `README.md` and `tasks/creator.md` first.

## 1. Inspect the task board

Check whether `tasks/README.md` and any `tasks/TASK-*.md` files exist.

- Ignore `tasks/creator.md`, `tasks/init.md`, and `tasks/README.md` when selecting implementation tasks.
- Treat a task as complete only when its exact final marker is checked:

  ```markdown
  - [x] Done with implementation and testing
  ```

- Inspect `tasks/claims/` for active ownership before selecting work.
- Reconcile the board before selecting work: a task containing the exact checked final marker is `Complete` even if its row still says `Available`, and completed claims are not active claims.

If the task board or task files do not exist, enter planner mode.

## 2. Select and atomically claim work

An available task is incomplete, has all dependencies complete, and has no active claim. Select the lowest numeric priority. Always consider the reserved finalizer after all non-finalizer tasks are complete and before entering planner mode.

Before editing any implementation file, atomically create:

```text
tasks/claims/TASK-NNN/
```

The claim must contain an `owner.md` file with a unique agent ID for this Codex invocation, task ID, hostname/terminal when available, start time, heartbeat time, and status. If the claim directory already exists, read its owner record. Continue only if its unique agent ID exactly matches the current invocation; matching hostname or terminal is not sufficient. Otherwise do not take the task; inspect the next available task.

After claiming, read the complete task file and implement only its scope. Update the heartbeat while working and follow the task’s completion protocol.

## 3. Wait for dependencies instead of exiting

If a selected task has incomplete dependencies, claim it, set its claim status to `waiting`, and keep the agent session active. Do not return a final response saying the task is blocked.

Run a persistent polling loop or equivalent long-running tool session. Re-read every dependency file every 15 seconds, update the heartbeat, and start implementation immediately when all dependencies contain the exact completion marker.

The agent may stop waiting only when the user cancels/changes the assignment, the runtime interrupts the session, or a genuine external blocker cannot be resolved by inspection or waiting.

## 4. Finalizer selection and cleanup

Do not enter planner mode merely because all implementation tasks are complete. First locate `tasks/TASK-999-finalize.md` (or the group’s explicitly reserved finalizer), claim it using the same ownership rules, and run it.

The finalizer must persistently poll until all implementation dependencies are complete, reconcile their board rows to `Complete`, run the full test suite, and verify the explicit deletion targets. Only after those checks pass may it delete generated `tasks/TASK-*.md`, `tasks/README.md`, and verified claim records belonging to the task group. It must preserve `tasks/creator.md`, `tasks/init.md`, and root `AGENTS.md`, and must never recursively delete `tasks/`.

For a group containing one implementation task, the finalizer depends on that one task and follows exactly the same path. A missing finalizer is a task-group creation error; do not treat the group as finalized or silently delete files.

## 5. Planner mode

Enter planner mode only when there is no available implementation task, no runnable finalizer, all unfinished tasks are actively claimed, or the task board has already been finalized.

Planner mode is plan-only by default. It may inspect the repository, summarize task/claim state, identify missing work, and propose ranked tasks or small edits. It must not create task files, modify source files, change checkboxes, take over claims, or delete files without explicit user authorization.

If the user explicitly asks for a small edit, perform only that requested edit. Destructive cleanup requires a finalizer task.

## 6. Reporting

Report one of:

- The task claimed and implementation started.
- The dependencies currently being polled and the next polling interval.
- Planner mode with the current repository/task-board summary.

Do not claim completion until implementation and tests pass and the task’s final checkbox is checked.
