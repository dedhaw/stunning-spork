# Task Creator and Agent Execution Guide

This file defines how Codex task files are created and how agents must execute them. Read the root [`README.md`](../README.md), [`tasks/init.md`](init.md), [`tasks/task-handler.md`](task-handler.md), and [`tasks/README.md`](README.md) before creating or running tasks. `tasks/init.md` is the startup protocol for an unassigned Codex session; `tasks/task-handler.md` is the execution and recovery procedure.

## Creating a task

Create one Markdown file per task using this naming format:

```text
TASK-NNN-short-description.md
```

Every task must include:

- A unique task ID.
- A clear implementation title.
- A numeric priority/rank.
- An explicit dependency list, or `None`.
- A link/instruction to read `README.md`.
- An instruction to read and follow `tasks/task-handler.md`.
- Implementation requirements.
- Test and acceptance requirements.
- Completion checkboxes.
- Instructions to update only the task’s own status.
- Instructions to claim the task before editing implementation files.
- Ownership and heartbeat metadata requirements.
- A granular checklist for every implementation, test, and documentation item.

New tasks must always begin with unchecked completion boxes. Never pre-check a task because implementation already exists elsewhere in the repository.

```markdown
- [ ] Implementation complete
- [ ] Tests complete
- [ ] Documentation updated if needed
- [ ] Done with implementation and testing
```

Add the task to `tasks/README.md`, including its rank and dependencies. Keep the dependency graph accurate.

When creating a temporary task group, create `tasks/TASK-999-finalize.md` in the same operation. Set its dependencies to every implementation task, including a single-task group, and add it to the board with the lowest execution priority. Do not wait for implementation to finish before creating the finalizer.

## Claims and ownership

Agents must claim a task before modifying implementation files. Claims use an atomic task-specific directory:

```text
tasks/claims/TASK-NNN/
```

The claim contains `owner.md` with a unique agent ID, task ID, hostname/terminal when available, start time, last heartbeat, status (`claimed`, `working`, `waiting`, `complete`, or `stale`), and a short `progress` summary. The agent ID must be unique to the Codex invocation; hostname and terminal are descriptive metadata only and cannot establish ownership.

Claim creation is the ownership lock. The invocation must atomically create the task directory before writing `owner.md`; only the invocation whose `mkdir` succeeds may work on that task. If the claim directory already exists, the agent must not continue it, rewrite it, or infer ownership from matching hostname, terminal, working directory, or agent-ID text. It must leave the task untouched and inspect another unclaimed task.

An interrupted task may be recovered only when the recorded status is not `complete`, the heartbeat is older than 30 minutes, and the owner has been verified inactive (no live matching process/session). The recovering agent must record the recovery evidence, preserve the existing owner record, acquire a recovery lock atomically, and then create a new unique claim ID. Never take over a fresh or active claim. The recovery agent begins with the first unchecked granular item and must not redo checked items unless verification shows they are invalid.

Agents update their heartbeat while working or waiting. Use a 30-minute stale-claim threshold only after verifying that the owner is no longer active; never take over an active claim. A completed agent checks its own task marker first, marks its claim complete, and releases only its own claim.

The task board and claims are temporary coordination artifacts and remain covered by the repository’s existing `tasks/*` ignore rule.

## Startup and planner behavior

Every repository should keep `tasks/init.md` as the startup protocol and root `AGENTS.md` as the automatic entry point. An unassigned agent must inspect the task board, reconcile task status from task checkboxes and claims, select the lowest-priority incomplete and unclaimed task, atomically claim it, and either implement it or wait for its dependencies.

After all non-finalizer tasks contain the exact checked completion marker, the agent must select the finalizer before entering planner mode. A task-group creator must create the finalizer at the same time as the implementation tasks so the one-task case is covered.

Planner mode is plan-only by default: it can inspect and propose work, but it does not create tasks or modify source files without explicit user approval. The finalizer is the only task allowed to remove generated task-board files.

### Planner approval gate

When a user gives a new substantial implementation request while no task is available, remain in planner mode. Do not implement the request directly. First inspect the repository and produce a concise plan summary containing:

- the objective and success criteria;
- the proposed implementation scope and affected areas;
- the ranked task breakdown and dependencies;
- the tests and acceptance checks; and
- important assumptions, risks, or limitations.

Then ask the user explicitly:

```text
Approve creating these tasks and implementing the plan?
```

Do not create task files, modify the task board, claim work, or edit source files before approval. A clear response such as `yes`, `approve`, or `proceed` authorizes task creation and implementation. A decline or changed request leaves the repository unchanged and returns to planning.

After approval, create the complete task group in one operation: all implementation tasks, `tasks/README.md`, and the mandatory `tasks/TASK-999-finalize.md`. Ensure every new checklist is unchecked, dependencies are accurate, and each task references `tasks/task-handler.md`. The creator is an orchestrator and must not claim or implement any task itself. Immediately run `make tasks-run` so every incomplete, unclaimed task receives its own worker Terminal session. After launching, monitor `tasks/logs/`, `tasks/runner/`, and `tasks/claims/` rather than editing implementation files.

An explicitly requested small edit may be performed directly when it does not require a task group. Treat requests involving a new service, feature, architectural change, or multiple files as substantial and require this approval gate.

### Launching parallel agents

After the user approves task creation, run:

```bash
make tasks-run
```

This runs `tasks/scripts/run-task-agents.sh`, which opens one macOS Terminal session running a `codex exec` process for each incomplete task without an existing claim, including the finalizer, with approximately one second between launches. Set `TASK_AGENT_DELAY` to override the delay when needed. Each process receives its task path and must perform the atomic claim itself. A task that is already complete or claimed is skipped, so rerunning the launcher does not intentionally duplicate active work. The creator must run this before claiming any implementation task and must not implement task work in its own session.

Output is stored under temporary coordination paths:

- `tasks/logs/TASK-NNN-*.log` contains each agent’s output.
- `tasks/runner/TASK-NNN-*.pid` contains each process ID.

Inspect logs and claim records to monitor progress. Stop a process only after confirming its PID from the matching PID file. The launcher never deletes tasks or claims.

This visible-terminal launcher requires macOS Terminal automation. Tests may set `TERMINAL_LAUNCHER` to an executable adapter with the worker script, task file, log file, and PID file as arguments.

## Final task for a task group

Every temporary task group must include exactly one final cleanup task. Create it when the group is created, after the implementation task IDs are known; do not wait until implementation tasks are complete:

```text
tasks/TASK-999-finalize.md
```

The final task must:

- Have the lowest execution priority and depend on every other task in the group.
- Wait using the same persistent polling protocol as any dependent task.
- Verify that every dependency contains the exact checked marker:

  ```markdown
  - [x] Done with implementation and testing
  ```

- Run the complete test suite before cleanup.
- Confirm there are no unfinished task dependencies.
- Delete only the generated task-group files after all checks pass:
  - `tasks/TASK-*.md`
  - `tasks/README.md`
- Delete only the claim directories belonging to this task group after verifying their task IDs; never delete another active agent’s claim.
- Preserve `tasks/creator.md` so it can be reused for a future task group.
- Check its own final cleanup marker last, immediately before or after removing the other task files.

Because cleanup is destructive, the final task must not use broad recursive deletion such as `rm -rf tasks`. It must resolve and delete the explicit task-group paths only, verify the target list first, and leave `tasks/creator.md` untouched. If any dependency is incomplete or tests fail, it must not delete anything.

The final task should use a completion checklist like:

```markdown
- [ ] All task dependencies complete
- [ ] Full test suite passes
- [ ] Task-group files removed
- [ ] Final cleanup complete
```

For a permanent project task board, omit cleanup only when the user explicitly requests that task files be retained as documentation. Otherwise the finalizer is mandatory, including when the group contains only one implementation task.

Before cleanup, reconcile `tasks/README.md`: every completed implementation task must be marked `Complete`, and stale values such as `Available` must not override a checked task marker.

## Task file template

Copy and adapt this template for new tasks:

```markdown
# TASK-NNN: Task title

Priority: N
Dependencies: None

Read `README.md`, `tasks/README.md`, and `tasks/task-handler.md` first and follow the task-handler procedure.

## Agent instructions

You may be assigned this task by saying:

```text
Do tasks/TASK-NNN-short-description.md
```

Before editing, read and follow `tasks/task-handler.md`, atomically claim `tasks/claims/TASK-NNN/`, and write `owner.md` with the agent ID, task ID, start time, heartbeat time, status, and progress.

If any dependency is incomplete, set the claim status to `waiting` and do not stop. Use a persistent polling session that re-reads each dependency every 15 seconds until every dependency contains `- [x] Done with implementation and testing`. Do not return a blocked response after one check.

Mark every implementation, test, and documentation item as an individual checkbox. Check each item immediately after its work and verification pass, and update the claim `progress` field. Leave unfinished items unchecked for recovery agents.

```

## Final-task template

Use this template for the cleanup task at the end of a temporary task group:

```markdown
# TASK-999: Finalize task group

Priority: 999
Dependencies: TASK-001, TASK-002, TASK-003

Read `README.md`, `tasks/README.md`, `tasks/creator.md`, and `tasks/task-handler.md` first and follow the task-handler procedure.

## Agent instructions

Do not begin cleanup until every dependency has the exact checked marker:

```markdown
- [x] Done with implementation and testing
```

If any dependency is incomplete, do not stop and do not report a blocker. Poll every 15 seconds in a persistent tool session until all dependencies are complete. Do not delete any files while waiting.

After all dependencies are complete, update their board rows to `Complete`, mark this claim as `working`, and run the full test suite. If tests fail, do not delete task files; continue inspecting or waiting as appropriate.

Before deletion, list and verify the explicit generated task files and claim directories. Delete `tasks/TASK-*.md`, `tasks/README.md`, and only the verified task-group claim directories. Preserve `tasks/creator.md`. Never delete the repository, workspace, or the entire `tasks/` directory.

## Completion checklist

- [ ] All task dependencies complete
- [ ] Full test suite passes
- [ ] Task-group files removed
- [ ] Final cleanup complete
```

Before implementing, inspect the repository and every dependency task file.

If any dependency is incomplete, do not implement yet, do not modify implementation files, and do not report the task as blocked. Announce the incomplete dependencies and continue polling as described below.

If this task is already checked complete, audit the implementation and tests against this file instead of blindly duplicating work.

## Implementation requirements

- [ ] Requirement one.
- [ ] Requirement two.

## Tests and acceptance

- [ ] Test scenario one.
- [ ] Test scenario two.

## Completion checklist

- [ ] Implementation complete
- [ ] Tests complete
- [ ] Documentation updated if needed
- [ ] Done with implementation and testing
```

## Dependency polling protocol

Dependency waiting is an expected active state, not a blocker. An agent assigned a dependent task must follow this loop:

1. Read each dependency task file.
2. Check for the exact final marker:

   ```markdown
   - [x] Done with implementation and testing
   ```

3. If every dependency is complete, begin the task immediately.
4. If any dependency is incomplete, announce the dependency status.
5. Start a persistent shell polling loop or equivalent long-running tool session that checks every 15 seconds.
6. Keep that polling session active and re-read the dependency files after every interval.
7. Repeat until every dependency is complete.

Use a status message such as:

```text
Waiting for TASK-003 and TASK-004. Rechecking their completion markers in 15 seconds.
```

Agents must continue polling in an active tool session until one of these conditions occurs:

- All dependencies become complete and implementation can begin.
- The user explicitly stops or changes the assignment.
- A genuine external blocker occurs that cannot be resolved by repository inspection or waiting.

An agent must not return a final response while dependency polling is active. It must not report an unfinished dependency as a blocker. A recommended polling command is:

```bash
while ! rg -q -- '- \[x\] Done with implementation and testing' dependency-file.md; do
  echo 'Dependency incomplete; checking again in 15 seconds.'
  sleep 15
done
```

Agents must not:

- Perform only one re-check and exit.
- Call an unmet dependency a blocker merely because it is unfinished.
- Modify implementation files while waiting.
- Check their own completion boxes before implementation and tests pass.
- Change another task’s checkboxes.

If the runtime interrupts the agent while it is waiting, the next invocation must resume by re-reading all dependencies rather than assuming they are complete.

## Completion protocol

After implementation:

1. Run the task’s required tests and relevant checks.
2. Fix failures within the task’s scope.
3. Check `Implementation complete`.
4. Check `Tests complete` only after tests pass.
5. Check `Documentation updated if needed` after applicable docs are current.
6. Check `Done with implementation and testing` last.
7. Report changed files, tests run, and any remaining limitations.

After checking an implementation task’s final marker, re-read the board. If all implementation tasks are complete, claim and run the finalizer in the same session when possible; do not stop merely because the implementation task itself is complete.

## Parallel execution

Tasks without unmet dependencies may run in parallel. Agents must avoid editing the same files where possible and preserve unrelated changes. A task that depends on another may be opened in a separate terminal at the same time, but it must remain in the polling loop until its dependencies are complete.

## Assignment examples

Independent task:

```text
Do tasks/TASK-001-project-setup.md
Read tasks/creator.md and follow its execution protocol.
```

Dependent task:

```text
Do tasks/TASK-006-validation-documentation.md
Read tasks/creator.md and keep polling all dependencies every 15 seconds until they are complete. Do not exit after one re-check.
```
