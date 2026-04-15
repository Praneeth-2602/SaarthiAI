# Saarthi MVP Status

## Done

### Repository structure
- Reorganized the repo to use root-level `frontend/` and `backend/` directories.
- Kept shared repo config at the root, including:
  - `.env.example`
  - `docker-compose.yml`
  - root `package.json`
  - `README.md`

### Frontend
- Created a Next.js app in `frontend/`.
- Implemented:
  - landing/root page that switches between marketing view and authenticated dashboard
  - login page with dev-safe OTP request flow
  - OTP verify page
  - dashboard shell and dashboard home
  - case workspace
  - chat panel with streaming agent response handling
  - document hub page
  - API proxy route for forwarding frontend requests to the backend API
- Added reusable UI/components for:
  - message bubbles
  - language selector
  - policy cards
  - document checklist
  - claim status

### Backend API
- Created an Express API in `backend/api/`.
- Implemented:
  - environment config
  - MongoDB connection setup
  - auth middleware with JWT
  - OTP request and verify endpoints
  - case create/list/fetch/history endpoints
  - document upload/list/download endpoints
  - agent invoke/state endpoints
- Added Mongo/Mongoose models for:
  - `Nominee`
  - `Case`
  - `Document`
- Added local file storage support for uploaded documents.

### Agent service
- Created a FastAPI + LangGraph service in `backend/agents/`.
- Implemented:
  - Mongo read/write helpers
  - graph state definition
  - orchestration flow
  - mocked Bima Sugam discovery
  - document checklist generation
  - document validation with Gemini fallback behavior
  - claim letter drafting
  - escalation placeholder for later extension
- Added RAG retrieval with:
  - Chroma path support
  - markdown fallback search when Chroma is not built yet

### Knowledge base
- Seeded `knowledge/` with:
  - IRDAI/general guidance
  - LIC claim docs
  - HDFC Life claim docs

### Tests and validation completed
- `python -m compileall backend/agents` passed
- `python -m pytest tests` in `backend/agents` passed
- `npm run typecheck -w @saarthi/api` passed
- `npm run typecheck -w @saarthi/frontend` passed
- `npm run lint -w @saarthi/frontend` passed
- `npm test -w @saarthi/api` passed

## Left

### Frontend runtime verification
- Finish diagnosing the frontend startup/runtime issue that caused Playwright to fail on navigation to `/login`.
- Run a production build for the frontend and fix any build/runtime issues that surface.
- Re-run Playwright after the frontend startup issue is resolved.

### End-to-end validation
- Run the full web + API + agents happy path manually:
  - request OTP
  - verify OTP
  - create case
  - discover policies
  - upload documents
  - validate document statuses
  - generate claim letters

### Environment hardening
- Confirm `.env` values and local service startup order for:
  - MongoDB
  - API
  - agent service
  - frontend
- Verify upload paths and local file permissions in a real run.

### Nice-to-finish MVP tasks
- Add stronger error handling and user-facing empty/error states in the frontend.
- Add more API tests around documents and agent streaming.
- Add more agent tests around document validation and drafting behavior.
- Optionally ingest Chroma embeddings with `backend/agents/rag/ingest.py` for richer retrieval quality.

## Current blocker
- The main unfinished item is frontend runtime validation. The codebase is scaffolded and typed, but the browser E2E flow is not yet confirmed green because Playwright timed out while opening `/login`.
