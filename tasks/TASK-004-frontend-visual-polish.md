# TASK-004: Frontend visual and accessibility polish

Priority: 4
Dependencies: TASK-001, TASK-002, TASK-003

Read `README.md` and `tasks/README.md` first. Read every dependency task file before starting.

## Agent instructions

If any dependency lacks `- [x] Done with implementation and testing`, claim `tasks/claims/TASK-004/`, mark the claim `waiting`, and persistently re-read all dependencies every 15 seconds until they complete. Once runnable, claim/mark the task `working` before editing implementation files. Include unique agent ID, task ID, hostname/terminal, start time, heartbeat, and status in `owner.md`. Update only this task’s checklist/status.

## Implementation requirements

- Give the React page a cohesive, responsive visual system for setup, capture, errors, and results, replacing the current static styling where appropriate.
- Make the experience readable and usable on narrow mobile screens as well as desktop, including visible focus states, adequate contrast, touch-sized controls, and reduced-motion support.
- Add semantic headings, live announcements for status changes, meaningful labels, and accessible error recovery.
- Keep measurement guidance prominent without making unsupported accuracy promises.

## Tests and acceptance

- Add or update component tests for accessible names, status announcements, and error/result rendering.
- Run the frontend build/test checks and the complete repository test suite.
- Manually inspect representative mobile and desktop layouts and record any tooling limitation.

## Completion checklist

- [ ] Implementation complete
- [ ] Tests complete
- [ ] Documentation updated if needed
- [ ] Done with implementation and testing
