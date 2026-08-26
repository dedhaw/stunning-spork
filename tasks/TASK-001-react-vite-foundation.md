# TASK-001: React/Vite frontend foundation

Priority: 1
Dependencies: None

Read `README.md` and `tasks/README.md` first.

## Agent instructions

Before editing implementation files, atomically claim `tasks/claims/TASK-001/` and write `owner.md` with a unique agent ID, task ID, hostname/terminal when available, start time, heartbeat time, and status. Update the heartbeat while working. Update only this task’s checklist/status.

## Implementation requirements

- Replace the static `web/index.html`/`web/app.js` entrypoint with a maintainable React application using a documented package/build setup (Vite is preferred).
- Preserve FastAPI’s production/static-serving contract, including the existing local development commands or update them with clear documentation.
- Establish a sensible component/state structure for setup, capture, submission, result, and error states without changing backend measurement behavior.
- Keep browser APIs behind small testable helpers where practical, and avoid logging images, media streams, or full request payloads.

## Tests and acceptance

- Add frontend unit/component tests for the initial render and primary state transitions, using the project’s documented test command.
- Verify the built frontend is served successfully by the FastAPI app and existing web integration tests are updated as needed.
- Document install, development, build, and test commands.

## Completion checklist

- [ ] Implementation complete
- [ ] Tests complete
- [ ] Documentation updated if needed
- [ ] Done with implementation and testing
