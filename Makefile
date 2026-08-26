PYTHON := python3
VENV := .venv
PIP := $(VENV)/bin/pip
PYTHON_BIN := $(VENV)/bin/python
UVICORN := $(VENV)/bin/uvicorn

.PHONY: setup run test

setup:
	$(PYTHON) -m venv $(VENV)
	$(PYTHON_BIN) -m pip install --upgrade pip
	$(PIP) install -r backend/requirements.txt

run: setup
	$(UVICORN) backend.app.main:app --reload --host 127.0.0.1 --port 8000

test: setup
	$(PYTHON_BIN) -m pytest
