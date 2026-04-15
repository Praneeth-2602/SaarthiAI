# Saarthi MVP

Saarthi is a production-leaning MVP for helping nominees discover life insurance policies, collect the right claim documents, and generate ready-to-submit claim letters.

## Monorepo layout

- `frontend`: Next.js nominee experience
- `backend/api`: Express API gateway and persistence layer
- `backend/agents`: FastAPI + LangGraph agent service
- `knowledge`: insurer and IRDAI knowledge base for RAG
- `storage/uploads`: local upload storage for MVP

## Local development

1. Copy `.env.example` to `.env` and fill in MongoDB plus LLM credentials.
2. Install JavaScript dependencies:

```bash
npm install
npm install --workspace @saarthi/api
npm install --workspace @saarthi/frontend
```

3. Create the Python virtual environment:

```bash
cd backend/agents
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

4. Start services:

```bash
npm run dev:api
npm run dev:web
cd backend/agents && uvicorn main:app --reload --port 8000
```

5. Ingest seeded knowledge when needed:

```bash
cd backend/agents
python rag/ingest.py
```

## MVP notes

- OTP delivery is dev-safe and returns a `debugOtp` in non-production environments.
- Bima Sugam, DigiLocker, Razorpay, and WhatsApp are mocked behind service adapters.
- Document uploads use local filesystem storage with an adapter that can be replaced by S3 later.
- Aadhaar and PAN are stored as plain strings for the MVP. Production work should encrypt them at rest.
