# RESQ-X Backend

Python backend for the RESQ-X disaster early-warning system.

This first step is the API foundation only: FastAPI, SQLite via SQLAlchemy, CORS, and a health check. Sensors, AI, alerts, and shelters are not implemented yet.

## Stack

- Python
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic

## Project structure

```
app/
    __init__.py
    main.py
    database.py
    models.py
    schemas.py
    api/
        __init__.py
        health.py
requirements.txt
README.md
```

## Setup

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

macOS / Linux:

```bash
source .venv/bin/activate
```

```bash
pip install -r requirements.txt
```

## Run

From the project root (`RESQ-X`):

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

## Health check

```
GET /api/health
```

Example response:

```json
{
    "status": "healthy",
    "service": "RESQ-X Backend",
    "version": "1.0.0"
}
```

Interactive docs: `http://127.0.0.1:8000/docs`
