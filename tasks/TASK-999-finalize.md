# TASK-999: Finalize React frontend task group

Priority: 999
Dependencies: TASK-001, TASK-002, TASK-003, TASK-004

Read `README.md`, `tasks/README.md`, and `tasks/creator.md` first.

## Agent instructions

Do not begin cleanup until every dependency contains the exact marker `- [x] Done with implementation and testing`. Claim `tasks/claims/TASK-999/`, mark it `waiting` if needed, and poll all dependencies every 15 seconds until they complete. Then reconcile the board rows, run the full test suite, and verify explicit deletion targets before cleanup. Never delete `tasks/creator.md`, `tasks/init.md`, or the `tasks/` directory itself. Delete only this temporary group’s task files, board, and verified claim directories after all checks pass.

## Completion checklist

- [ ] All task dependencies complete
- [ ] Full test suite passes
- [ ] Task-group files removed
- [ ] Final cleanup complete
