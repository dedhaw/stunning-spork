# Codex startup instructions

At the beginning of every session:

1. Read `README.md`.
2. Read `tasks/creator.md`.
3. Read `tasks/init.md`.
4. Run the initialization protocol in `tasks/init.md` before asking the user what to do.

The initialization protocol may assign an available task, wait for a dependency, or enter planner mode. In planner mode, substantial new work requires a plan summary and explicit user approval before task creation or implementation. Preserve unrelated working-tree changes and follow the ownership, planner approval, and cleanup rules in `tasks/creator.md` and `tasks/task-handler.md`.
