# Typeflow

A Typeform-inspired form builder with a polished conversational respondent experience.

## Quick Start

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
cp .env.example .env  # adjust if needed
python -m app.seed && uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local  # adjust if needed
npm run dev
```

Open http://localhost:3000 (or the port shown in terminal).

---

## Environment Configuration

All environment-specific configuration is centralized in `.env` files. **Never commit actual `.env` files** — they are ignored by Git. Use the provided `.env.example` files as templates.

### Frontend (`frontend/`)

| File | Purpose |
|------|---------|
| `frontend/.env.example` | Template — safe to commit |
| `frontend/.env.local` | Local overrides — **ignored by Git** |

#### Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Base URL of the FastAPI backend (include `/api`) | `http://localhost:8000/api` |

**Local development:**
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

**Production deployment:**
```bash
# Set in your hosting platform (Vercel, Netlify, etc.)
NEXT_PUBLIC_API_URL=https://your-backend-domain/api
```

The frontend reads this via `frontend/lib/config.ts` — components should not access `process.env` directly.

---

### Backend (`backend/`)

| File | Purpose |
|------|---------|
| `backend/.env.example` | Template — safe to commit |
| `backend/.env` | Local overrides — **ignored by Git** |

#### Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLAlchemy database URL | `sqlite:///./typeflow.db` |
| `CORS_ORIGINS` | Comma-separated allowed origins for CORS | `http://localhost:3000,http://127.0.0.1:3000` |
| `HOST` | Server bind address | `0.0.0.0` |
| `PORT` | Server port | `8000` |

**Local development:**
```bash
# backend/.env
DATABASE_URL=sqlite:///./typeflow.db
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001
HOST=0.0.0.0
PORT=8000
```

**Production deployment (conceptual):**
```bash
# Database — use persistent volume path
DATABASE_URL=sqlite:////app/data/typeflow.db
# Or PostgreSQL:
# DATABASE_URL=postgresql://user:password@host:5432/typeflow

# CORS — production frontend domain(s)
CORS_ORIGINS=https://your-frontend-domain,https://www.your-frontend-domain

# Server
HOST=0.0.0.0
PORT=8000
```

The backend reads these via `backend/app/config.py`.

---

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── config.py       # Centralized settings (reads .env)
│   │   ├── database.py     # SQLAlchemy engine (uses config)
│   │   ├── main.py         # FastAPI app (uses config for CORS)
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── seed.py         # Seed data (loads .env)
│   │   └── ...
│   ├── .env.example        # Template
│   ├── .env                # Local (gitignored)
│   └── requirements.txt
├── frontend/
│   ├── lib/
│   │   ├── config.ts       # Centralized config (reads NEXT_PUBLIC_API_URL)
│   │   ├── api.ts          # API client (uses config)
│   │   └── ...
│   ├── .env.example        # Template
│   ├── .env.local          # Local (gitignored)
│   └── package.json
└── .gitignore
```

---

## Deployment Notes

- **Frontend**: Build with `npm run build`. The `NEXT_PUBLIC_API_URL` is embedded at build time.
- **Backend**: Runs via `uvicorn app.main:app`. Configuration loaded at startup from `.env`.
- **Database**: SQLite file path controlled by `DATABASE_URL`. For persistent deployments, mount a volume and set `DATABASE_URL=sqlite:////app/data/typeflow.db`.
- **CORS**: Must include your production frontend origin(s) in `CORS_ORIGINS`.

---

## License

MIT