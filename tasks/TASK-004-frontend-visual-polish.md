# TASK-004: Frontend visual and accessibility polish

Priority: 4
Dependencies: TASK-001, TASK-002, TASK-003

Read `README.md`, `tasks/README.md`, and `tasks/task-handler.md` first and follow the task-handler procedure. Read every dependency task file before starting.

## Agent instructions

Read this complete task file, inspect `tasks/claims/`, and follow `tasks/task-handler.md` before acting. Inspect the complete TASK-001, TASK-002, and TASK-003 files and check each exact completion marker. Atomically create `tasks/claims/TASK-004/`; only the invocation whose `mkdir` succeeds may write `owner.md` or work on this task. If the directory already exists, do not continue it or rewrite its owner record; inspect the next unclaimed task. Immediately write `owner.md` with a unique agent ID for this invocation, task ID, hostname/terminal when available, start time, last heartbeat, status (`claimed`, `working`, `waiting`, or `complete`), and a `progress` summary. If any dependency lacks `- [x] Done with implementation and testing`, set the claim to `waiting`, set `progress` to the dependency names, and persistently re-read all dependencies every 15 seconds, updating the heartbeat, until they complete. Once runnable, set the claim to `working` before editing implementation files. After each verified granular item, update its checkbox, heartbeat, and `progress`. Update only this task’s checklist/status.

## Implementation requirements

- [ ] Give the React page a cohesive, responsive visual system for setup, capture, errors, and results, replacing the current static styling where appropriate.
- [ ] Make the experience readable and usable on narrow mobile screens as well as desktop, including visible focus states, adequate contrast, touch-sized controls, and reduced-motion support.
- [ ] Add semantic headings, live announcements for status changes, meaningful labels, and accessible error recovery.
- [ ] Keep measurement guidance prominent without making unsupported accuracy promises.

## Tests and acceptance

- [ ] Add or update component tests for accessible names, status announcements, and error/result rendering.
- [ ] Run the frontend build/test checks and the complete repository test suite.
- [ ] Manually inspect representative mobile and desktop layouts and record any tooling limitation.

## Completion checklist

- [ ] Implementation complete
- [ ] Tests complete
- [ ] Documentation updated if needed
- [ ] Done with implementation and testing
