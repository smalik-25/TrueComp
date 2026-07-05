VENV := .venv
PY := $(VENV)/bin/python
PIP := $(VENV)/bin/pip

.PHONY: install schema load resolve test lint dbt train arbitrage clean

install:                          ## create venv and install deps
	python3 -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt

schema:                           ## apply db/schema.sql to DATABASE_URL
	$(PY) db/apply_schema.py

load:                             ## load committed fixtures into the database
	$(PY) -m ingestion.run --source all --from-fixtures

resolve:                          ## run entity resolution + print match rates
	$(PY) -m resolution.run

test:                             ## run the adapter/resolution test suite
	PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 $(VENV)/bin/pytest -q

lint:                             ## static checks
	$(VENV)/bin/ruff check .

dbt:                              ## build the dbt marts
	cd dbt_project && DBT_PROFILES_DIR=. env $$(../$(VENV)/bin/python ../scripts/pg_env.py) ../$(VENV)/bin/dbt build

train:                            ## train + evaluate the price model
	$(PY) -m ml.train

arbitrage:                        ## surface active asks below the sold level (needs active listings)
	$(PY) -m ml.arbitrage

clean:
	rm -rf $(VENV) .pytest_cache dbt_project/target dbt_project/logs
