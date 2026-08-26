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

If the task board or task files do not exist, enter planner mode.

## 2. Select and atomically claim work

An available task is incomplete, has all dependencies complete, and has no active claim. Select the lowest numeric priority.

Before editing any implementation file, atomically create:

```text
tasks/claims/TASK-NNN/
```

The claim must contain an `owner.md` file with a unique agent ID, task ID, hostname/terminal when available, start time, heartbeat time, and status. If the claim directory already exists, do not take the task; inspect the next available task.

After claiming, read the complete task file and implement only its scope. Update the heartbeat while working and follow the task’s completion protocol.

## 3. Wait for dependencies instead of exiting

If a selected task has incomplete dependencies, claim it, set its claim status to `waiting`, and keep the agent session active. Do not return a final response saying the task is blocked.

Run a persistent polling loop or equivalent long-running tool session. Re-read every dependency file every 15 seconds, update the heartbeat, and start implementation immediately when all dependencies contain the exact completion marker.

The agent may stop waiting only when the user cancels/changes the assignment, the runtime interrupts the session, or a genuine external blocker cannot be resolved by inspection or waiting.

## 4. Planner mode

Enter planner mode when there is no available implementation task, all tasks are complete, all unfinished tasks are actively claimed, or the task board has been finalized.

Planner mode is plan-only by default. It may inspect the repository, summarize task/claim state, identify missing work, and propose ranked tasks or small edits. It must not create task files, modify source files, change checkboxes, take over claims, or delete files without explicit user authorization.

If the user explicitly asks for a small edit, perform only that requested edit. Destructive cleanup requires a finalizer task.

## 5. Reporting

Report one of:

- The task claimed and implementation started.
- The dependencies currently being polled and the next polling interval.
- Planner mode with the current repository/task-board summary.

Do not claim completion until implementation and tests pass and the task’s final checkbox is checked.
