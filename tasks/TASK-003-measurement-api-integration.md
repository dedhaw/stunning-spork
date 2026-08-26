# TASK-003: Measurement API integration

Priority: 3
Dependencies: TASK-001, TASK-002

Read `README.md` and `tasks/README.md` first. Read every dependency task file before starting.

## Agent instructions

If either dependency lacks `- [x] Done with implementation and testing`, claim `tasks/claims/TASK-003/`, mark the claim `waiting`, and persistently re-read both dependencies every 15 seconds until they complete. Once runnable, claim/mark the task `working` before editing implementation files. Include unique agent ID, task ID, hostname/terminal, start time, heartbeat, and status in `owner.md`. Update only this task’s checklist/status.

## Implementation requirements

- Submit the two captured images, height, selected arm, and a generated client request ID to `POST /v1/measurements/arm-length` using the documented multipart contract.
- Add loading, success, structured validation/error, retry, and cancellation states without exposing raw images or request payloads in logs or UI diagnostics.
- Render the returned measurement, confidence, quality status, quality flags, and version metadata in a comprehensible result state.
- Keep the API client isolated and testable, and handle network failures and non-JSON responses safely.

## Tests and acceptance

- Test multipart field construction, successful responses, structured API errors, validation errors, network failures, and retry behavior with mocked fetch.
- Verify the existing backend API tests continue to pass and the browser app can submit a valid captured payload against the local API.

## Completion checklist

- [ ] Implementation complete
- [ ] Tests complete
- [ ] Documentation updated if needed
- [ ] Done with implementation and testing
