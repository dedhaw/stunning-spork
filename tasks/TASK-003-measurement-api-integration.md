# TASK-003: Measurement API integration

Priority: 3
Dependencies: TASK-001, TASK-002

Read `README.md`, `tasks/README.md`, and `tasks/task-handler.md` first and follow the task-handler procedure. Read every dependency task file before starting.

## Agent instructions

Read this complete task file, inspect `tasks/claims/`, and follow `tasks/task-handler.md` before acting. Inspect the complete TASK-001 and TASK-002 files and check each exact completion marker. Atomically create `tasks/claims/TASK-003/`; only the invocation whose `mkdir` succeeds may write `owner.md` or work on this task. If the directory already exists, do not continue it or rewrite its owner record; inspect the next unclaimed task. Immediately write `owner.md` with a unique agent ID for this invocation, task ID, hostname/terminal when available, start time, last heartbeat, status (`claimed`, `working`, `waiting`, or `complete`), and a `progress` summary. If either dependency lacks `- [x] Done with implementation and testing`, set the claim to `waiting`, set `progress` to the dependency names, and persistently re-read both dependencies every 15 seconds, updating the heartbeat, until they complete. Once runnable, set the claim to `working` before editing implementation files. After each verified granular item, update its checkbox, heartbeat, and `progress`. Update only this task’s checklist/status.

## Implementation requirements

- [ ] Submit the two captured images, height, selected arm, and a generated client request ID to `POST /v1/measurements/arm-length` using the documented multipart contract.
- [ ] Add loading, success, structured validation/error, retry, and cancellation states without exposing raw images or request payloads in logs or UI diagnostics.
- [ ] Render the returned measurement, confidence, quality status, quality flags, and version metadata in a comprehensible result state.
- [ ] Keep the API client isolated and testable, and handle network failures and non-JSON responses safely.

## Tests and acceptance

- [ ] Test multipart field construction, successful responses, structured API errors, validation errors, network failures, and retry behavior with mocked fetch.
- [ ] Verify the existing backend API tests continue to pass and the browser app can submit a valid captured payload against the local API.

## Completion checklist

- [ ] Implementation complete
- [ ] Tests complete
- [ ] Documentation updated if needed
- [ ] Done with implementation and testing
