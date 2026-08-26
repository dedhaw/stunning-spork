# TASK-001: React/Vite frontend foundation

Priority: 1
Dependencies: None

Read `README.md`, `tasks/README.md`, and `tasks/task-handler.md` first and follow the task-handler procedure.

## Agent instructions

Read this complete task file, inspect `tasks/claims/`, and follow `tasks/task-handler.md` before acting. Atomically create `tasks/claims/TASK-001/`; only the invocation whose `mkdir` succeeds may write `owner.md` or work on this task. If the directory already exists, do not continue it, rewrite its owner record, or infer ownership from matching metadata; inspect the next unclaimed task. Immediately write `owner.md` with a unique agent ID for this invocation, task ID, hostname/terminal when available, start time, last heartbeat, status (`claimed`, `working`, `waiting`, or `complete`), and a `progress` summary naming the first unchecked item. Update the heartbeat and `progress` after each verified granular item. Update only this task’s checklist/status.

## Implementation requirements

- [ ] Replace the static `web/index.html`/`web/app.js` entrypoint with a maintainable React application using a documented package/build setup (Vite is preferred).
- [ ] Preserve FastAPI’s production/static-serving contract, including the existing local development commands or update them with clear documentation.
- [ ] Establish a sensible component/state structure for setup, capture, submission, result, and error states without changing backend measurement behavior.
- [ ] Keep browser APIs behind small testable helpers where practical, and avoid logging images, media streams, or full request payloads.

## Tests and acceptance

- [ ] Add frontend unit/component tests for the initial render and primary state transitions, using the project’s documented test command.
- [ ] Verify the built frontend is served successfully by the FastAPI app and existing web integration tests are updated as needed.
- [ ] Document install, development, build, and test commands.

## Completion checklist

- [ ] Implementation complete
- [ ] Tests complete
- [ ] Documentation updated if needed
- [ ] Done with implementation and testing
