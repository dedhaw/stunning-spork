# TASK-999: Finalize React frontend task group

Priority: 999
Dependencies: TASK-001, TASK-002, TASK-003, TASK-004

Read `README.md`, `tasks/README.md`, `tasks/creator.md`, and `tasks/task-handler.md` first and follow the task-handler procedure.

## Agent instructions

Read this complete task file, inspect `tasks/claims/`, and follow `tasks/task-handler.md` before acting. Inspect every dependency task file and check each exact completion marker. Atomically create `tasks/claims/TASK-999/`; only the invocation whose `mkdir` succeeds may write `owner.md` or work on this task. If the directory already exists, do not continue it or rewrite its owner record; inspect the next unclaimed task. Immediately write `owner.md` with a unique agent ID for this invocation, task ID, hostname/terminal when available, start time, last heartbeat, status (`claimed`, `working`, `waiting`, or `complete`), and a `progress` summary. Do not begin cleanup until every dependency contains the exact marker `- [x] Done with implementation and testing`; if not, set the claim to `waiting`, set `progress` to the dependency names, update its heartbeat, and poll all dependencies every 15 seconds without stopping or reporting a blocker. After all dependencies complete, reconcile their board rows to `Complete`, set this claim to `working`, set `progress` to the next cleanup item, confirm there are no unfinished dependencies, and run the full test suite. If tests fail, do not delete anything. Before deletion, list and verify the explicit generated task files and only this group’s claim directories. Check each cleanup checkbox immediately after verification, with this task’s final cleanup marker last, immediately before or after removing the other task files. Never delete `tasks/creator.md`, `tasks/task-handler.md`, `tasks/init.md`, root `AGENTS.md`, or the `tasks/` directory itself. Delete only this temporary group’s task files, board, and verified claim directories after all checks pass.

## Completion checklist

- [ ] All task dependencies complete
- [ ] Full test suite passes
- [ ] Task-group files removed
- [ ] Final cleanup complete
