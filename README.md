# Saarthi MVP

Saarthi is a two-application MVP for helping nominees move through life-insurance claims with less friction. The rebuilt implementation uses a Next.js frontend and a single FastAPI backend that now includes the agent workflow directly instead of splitting agents into a separate service.

## Current architecture

- `frontend/`: Next.js nominee experience
- `backend/`: FastAPI API, auth flow, case management, document handling, and integrated agent orchestration
- `knowledge/`: insurer and IRDAI reference material used by the backend workflow
- `storage/uploads/`: local upload storage for the MVP

## Requirements

- Node.js 22+
- npm 10+
- Python 3.11+
- MongoDB 7+ running locally or reachable through `MONGODB_URI`

## Installation

1. Clone the repository and move into the project root.
2. Copy the environment template:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Install frontend dependencies from the repo root:

```bash
npm install
```

4. Create the backend virtual environment and install Python dependencies:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

macOS/Linux activation:

```bash
source backend/venv/bin/activate
```

## Environment setup

The default local ports are:

- frontend: `3000`
- backend: `4000`
- MongoDB: `27017`

Important variables in `.env`:

- `PORT`: FastAPI port
- `FRONTEND_URL`: allowed frontend origin for CORS
- `NEXT_PUBLIC_API_URL`: backend URL consumed by the frontend proxy
- `MONGODB_URI`: Mongo connection string
- `MONGODB_DB`: database name
- `JWT_SECRET`: signing secret for nominee auth
- `OTP_TTL_SECONDS`: OTP expiry time
- `UPLOAD_DIR`: local upload path

## Running locally

Start MongoDB first.

Then run the backend from the project root:

```bash
npm run dev:api
```

In another terminal, run the frontend:

```bash
npm run dev:web
```

Open:

- frontend: `http://localhost:3000`
- backend health check: `http://localhost:4000/health`

## Docker

The repository now ships with a two-service app setup plus MongoDB:

```bash
docker compose up --build
```

This starts:

- `mongodb`
- `api`
- `web`

## Development flow

1. Request an OTP from `/login`
2. Use the debug OTP returned in development mode
3. Create a case from the dashboard
4. Open the case workspace
5. Upload supporting documents
6. Chat with Saarthi to move the case toward draft claim letters

## Validation commands

Backend import and syntax:

```bash
python -m compileall backend
python -c "import backend.main; print('backend import ok')"
```

Frontend:

```bash
npm run typecheck -w @saarthi/frontend
npm run build -w @saarthi/frontend
```

## Notes

- OTP delivery is dev-safe and returns a `debugOtp` outside production.
- Document uploads are stored locally for the MVP.
- The backend now keeps policy discovery, document validation state, and claim-letter drafting in one FastAPI service.
- Aadhaar and PAN are still treated as plain strings in the MVP and should be encrypted before any production use.
- A couple of permission-locked legacy cache folders may still exist under `backend/agents/`; they are not part of the active implementation.

## Push helper

To publish the rebuilt codebase in a sequence of focused commits, use:

```powershell
.\scripts\push-rebuild.ps1
```

The script is designed to create at least 10 commits from the current rebuilt implementation, skip the obsolete blocked legacy cache paths, and push to the existing `origin` remote on the current branch.
