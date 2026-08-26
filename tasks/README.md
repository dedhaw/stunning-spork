# Task board

Temporary React frontend migration task group. Tasks are ordered by numeric priority; lower numbers run first when dependencies are satisfied.

| Task | Priority | Dependencies | Status |
| --- | ---: | --- | --- |
| [TASK-001](TASK-001-react-vite-foundation.md) React/Vite foundation | 1 | None | Available |
| [TASK-002](TASK-002-media-capture-flow.md) Media permission and capture flow | 2 | TASK-001 | Available |
| [TASK-003](TASK-003-measurement-api-integration.md) Measurement API integration | 3 | TASK-001, TASK-002 | Available |
| [TASK-004](TASK-004-frontend-visual-polish.md) Visual and accessibility polish | 4 | TASK-001, TASK-002, TASK-003 | Available |
| [TASK-999](TASK-999-finalize.md) Finalize task group | 999 | TASK-001, TASK-002, TASK-003, TASK-004 | Reserved |

Agents must update only the status/checklist in their assigned task file and preserve unrelated working-tree changes.
