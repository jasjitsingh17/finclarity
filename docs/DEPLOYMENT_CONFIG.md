# FinClarity Deployment Configuration

FinClarity now separates local development addresses from production configuration.

## Frontend

The frontend reads `VITE_API_BASE_URL`.

If it is not set, the app falls back to:

```text
http://127.0.0.1:8010
```

For a deployed frontend, configure:

```text
VITE_API_BASE_URL=https://YOUR-BACKEND-DOMAIN
```

Vite injects this at build time, so redeploy the frontend after changing it.

## Backend CORS

The FastAPI backend reads `FINCLARITY_CORS_ORIGINS`.

For local development, no variable is required; FinClarity permits:

```text
http://localhost:5173
http://127.0.0.1:5173
```

For production:

```text
FINCLARITY_CORS_ORIGINS=https://YOUR-FRONTEND-DOMAIN
```

Multiple origins can be comma-separated.

## Local development

Backend:

```bash
source .venv/bin/activate
python -m uvicorn backend.main:app --reload --port 8010
```

Frontend:

```bash
npm run dev
```

No `.env` file is required for the existing local setup.

## Production sequence

1. Deploy the FastAPI backend.
2. Copy the backend public HTTPS URL.
3. Set `VITE_API_BASE_URL` on the frontend host.
4. Deploy/redeploy the frontend.
5. Copy the frontend public HTTPS origin.
6. Set `FINCLARITY_CORS_ORIGINS` on the backend host.
7. Redeploy/restart the backend.
8. Run final live checks.
