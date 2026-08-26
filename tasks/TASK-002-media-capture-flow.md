# TASK-002: Media permission and guided capture flow

Priority: 2
Dependencies: TASK-001

Read `README.md`, `tasks/README.md`, and `tasks/task-handler.md` first and follow the task-handler procedure. Read the complete dependency task file before starting.

## Agent instructions

Read this complete task file, inspect `tasks/claims/`, and follow `tasks/task-handler.md` before acting. Inspect the complete TASK-001 file and check its exact completion marker. Atomically create `tasks/claims/TASK-002/`; only the invocation whose `mkdir` succeeds may write `owner.md` or work on this task. If the directory already exists, do not continue it or rewrite its owner record; inspect the next unclaimed task. Immediately write `owner.md` with a unique agent ID for this invocation, task ID, hostname/terminal when available, start time, last heartbeat, status (`claimed`, `working`, `waiting`, or `complete`), and a `progress` summary. If TASK-001 lacks `- [x] Done with implementation and testing`, set the claim to `waiting`, set `progress` to `waiting for TASK-001`, and persistently re-read the dependency every 15 seconds, updating the heartbeat, until it completes. Once runnable, set the claim to `working` before editing implementation files. After each verified granular item, update its checkbox, heartbeat, and `progress`. Update only this task’s checklist/status.

## Implementation requirements

- [ ] Implement the guided front-view and side-view capture flow in React with clear progress, retake, permission, unsupported-device, and stream-error states.
- [ ] Centralize `navigator.mediaDevices.getUserMedia` handling and request only the media capabilities needed by the product (camera for measurement; microphone support may be exposed as an opt-in capability without recording audio).
- [ ] Preserve image quality, orientation, and in-memory handling expected by the API; stop tracks when leaving capture or unmounting.
- [ ] Make controls usable on mobile and keyboard-accessible, with clear camera/microphone permission explanations and privacy messaging.

## Tests and acceptance

- [ ] Test permission granted, denied, unavailable, retake, front capture, side capture, and cleanup paths with mocked media devices.
- [ ] Verify no audio is recorded or uploaded unless an explicit future requirement enables it.
- [ ] Manually verify the flow on a localhost-capable browser or document the environment limitation.

## Completion checklist

- [ ] Implementation complete
- [ ] Tests complete
- [ ] Documentation updated if needed
- [ ] Done with implementation and testing
