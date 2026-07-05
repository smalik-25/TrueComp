FROM python:3.11-slim

WORKDIR /app

# System deps kept minimal; psycopg[binary] ships its own libpq.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Default to the ingestion entrypoint; overridden by the orchestrator per job.
CMD ["python", "-m", "ingestion.run"]
