# Typeflow API

## Local Development

```bash
python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
cp .env.example .env  # adjust if needed
python -m app.seed && uvicorn app.main:app --reload --port 8000
```

## Environment Configuration

All configuration is loaded from `.env` (see `.env.example` for template).

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLAlchemy database URL | `sqlite:///./typeflow.db` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000,http://127.0.0.1:3000` |
| `HOST` | Server bind address | `0.0.0.0` |
| `PORT` | Server port | `8000` |

Configuration is centralized in `app/config.py` and used by `app/database.py` and `app/main.py`.