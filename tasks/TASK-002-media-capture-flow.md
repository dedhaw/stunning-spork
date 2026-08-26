# TASK-002: Media permission and guided capture flow

Priority: 2
Dependencies: TASK-001

Read `README.md` and `tasks/README.md` first. Read the complete dependency task file before starting.

## Agent instructions

If TASK-001 lacks `- [x] Done with implementation and testing`, claim `tasks/claims/TASK-002/`, mark the claim `waiting`, and persistently re-read the dependency every 15 seconds until it completes. Once runnable, claim/mark the task `working` before editing implementation files. Include unique agent ID, task ID, hostname/terminal, start time, heartbeat, and status in `owner.md`. Update only this task’s checklist/status.

## Implementation requirements

- Implement the guided front-view and side-view capture flow in React with clear progress, retake, permission, unsupported-device, and stream-error states.
- Centralize `navigator.mediaDevices.getUserMedia` handling and request only the media capabilities needed by the product (camera for measurement; microphone support may be exposed as an opt-in capability without recording audio).
- Preserve image quality, orientation, and in-memory handling expected by the API; stop tracks when leaving capture or unmounting.
- Make controls usable on mobile and keyboard-accessible, with clear camera/microphone permission explanations and privacy messaging.

## Tests and acceptance

- Test permission granted, denied, unavailable, retake, front capture, side capture, and cleanup paths with mocked media devices.
- Verify no audio is recorded or uploaded unless an explicit future requirement enables it.
- Manually verify the flow on a localhost-capable browser or document the environment limitation.

## Completion checklist

- [ ] Implementation complete
- [ ] Tests complete
- [ ] Documentation updated if needed
- [ ] Done with implementation and testing
