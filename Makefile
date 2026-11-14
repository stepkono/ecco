demo:
	bash demo/run_demo.sh

demo-check:
	bash demo/run_demo.sh --auto

test:
	.venv/bin/python -m pytest -q tests

.PHONY: demo demo-check test
