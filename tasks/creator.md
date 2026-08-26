# Task Creator and Agent Execution Guide

This file defines how Codex task files are created and how agents must execute them. Read the root [`README.md`](../README.md) and [`tasks/README.md`](README.md) before creating or running tasks.

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
- Implementation requirements.
- Test and acceptance requirements.
- Completion checkboxes.
- Instructions to update only the task’s own status.

New tasks must always begin with unchecked completion boxes. Never pre-check a task because implementation already exists elsewhere in the repository.

```markdown
- [ ] Implementation complete
- [ ] Tests complete
- [ ] Documentation updated if needed
- [ ] Done with implementation and testing
```

Add the task to `tasks/README.md`, including its rank and dependencies. Keep the dependency graph accurate.

## Final task for a task group

Every task group may include one final cleanup task, created only after all implementation tasks are known:

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

The final task is optional for an ongoing project. Use it only when the task files are temporary implementation artifacts and no longer need to serve as project documentation.

## Task file template

Copy and adapt this template for new tasks:

```markdown
# TASK-NNN: Task title

Priority: N
Dependencies: None

Read `README.md` and `tasks/README.md` first.

## Agent instructions

You may be assigned this task by saying:

```text
Do tasks/TASK-NNN-short-description.md
```

```

## Final-task template

Use this template for the cleanup task at the end of a temporary task group:

```markdown
# TASK-999: Finalize task group

Priority: 999
Dependencies: TASK-001, TASK-002, TASK-003

Read `README.md`, `tasks/README.md`, and `tasks/creator.md` first.

## Agent instructions

Do not begin cleanup until every dependency has the exact checked marker:

```markdown
- [x] Done with implementation and testing
```

If any dependency is incomplete, do not stop and do not report a blocker. Poll every 15 seconds in a persistent tool session until all dependencies are complete. Do not delete any files while waiting.

After all dependencies are complete, run the full test suite. If tests fail, fix only the failure within scope or stop without deleting task files.

Before deletion, list and verify the explicit generated task files. Delete `tasks/TASK-*.md` and `tasks/README.md` only. Preserve `tasks/creator.md`. Never delete the repository, workspace, or the entire `tasks/` directory.

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

- Requirement one.
- Requirement two.

## Tests and acceptance

- Test scenario one.
- Test scenario two.

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
