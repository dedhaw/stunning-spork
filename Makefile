PYTHON := python3
VENV := .venv
PIP := $(VENV)/bin/pip
PYTHON_BIN := $(VENV)/bin/python
UVICORN := $(VENV)/bin/uvicorn
TERMINAL ?= auto
BACKEND_COMMAND := cd $(CURDIR) && $(UVICORN) backend.app.main:app --reload --host 127.0.0.1 --port 8000
FRONTEND_COMMAND := cd $(CURDIR) && npm run dev -- --host 127.0.0.1

ifeq ($(OS),Windows_NT)
DEFAULT_TERMINAL := windows
else
DEFAULT_TERMINAL := mac
endif

.PHONY: setup run kill build test tasks-run

setup:
	$(PYTHON) -m venv $(VENV)
	$(PYTHON_BIN) -m pip install --upgrade pip
	$(PIP) install -r backend/requirements.txt
	npm install
	npm run build

build:
	npm run build

run: setup
	@launcher="$(TERMINAL)"; \
	if [ "$$launcher" = auto ]; then launcher="$(DEFAULT_TERMINAL)"; fi; \
	case "$$launcher" in \
		mac|MAC|terminal|TERMINAL) \
			osascript \
				-e 'tell application "Terminal"' \
				-e 'activate' \
				-e 'do script "$(BACKEND_COMMAND)"' \
				-e 'do script "$(FRONTEND_COMMAND)"' \
				-e 'end tell' ;; \
		windows|WINDOWS|wt|WT) \
			wt.exe new-tab --title "stunning-spork backend" cmd /k "$(BACKEND_COMMAND)" \; \
			wt.exe new-tab --title "stunning-spork frontend" cmd /k "$(FRONTEND_COMMAND)" ;; \
		cmux|CMUX) \
			command -v cmux >/dev/null || { echo "cmux CLI not found; launch cmux once to install it." >&2; exit 1; }; \
			cmux new-workspace --cwd "$(CURDIR)" --command "$(BACKEND_COMMAND)"; \
			cmux new-workspace --cwd "$(CURDIR)" --command "$(FRONTEND_COMMAND)" ;; \
		vscode|VSCODE|code|CODE) \
			command -v code >/dev/null || { echo "VS Code CLI not found; install the 'code' command in PATH." >&2; exit 1; }; \
			code --new-window "$(CURDIR)"; \
			echo "VS Code opened. Run these in two integrated terminals:"; \
			echo "  $(BACKEND_COMMAND)"; \
			echo "  $(FRONTEND_COMMAND)" ;; \
		*) echo "Unsupported TERMINAL='$(TERMINAL)'. Use mac, windows, cmux, vscode, or auto." >&2; exit 1 ;; \
	esac

kill:
	@for port in 8000 5173; do \
		pids=$$(lsof -ti tcp:$$port); \
		if [ -n "$$pids" ]; then kill $$pids; fi; \
	done

test: setup
	npm test
	$(PYTHON_BIN) -m pytest
	./tasks/scripts/test-run-task-agents.sh

tasks-run:
	./tasks/scripts/run-task-agents.sh
