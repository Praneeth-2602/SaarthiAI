# Saarthi — Full Implementation Guide
### Agentic Insurance Claims Navigator | MERN + Next.js + Python + LangGraph

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Repository Structure](#2-repository-structure)
3. [Environment Setup](#3-environment-setup)
4. [Backend — Node.js/Express API](#4-backend--nodejs-express-api)
5. [Agent Layer — Python + LangGraph](#5-agent-layer--python--langgraph)
   - 5.1 [Discovery Agent](#51-discovery-agent)
   - 5.2 [Document Intelligence Agent](#52-document-intelligence-agent)
   - 5.3 [Claim Drafting Agent](#53-claim-drafting-agent)
   - 5.4 [Escalation Agent](#54-escalation-agent)
   - 5.5 [LangGraph Orchestration](#55-langgraph-orchestration)
6. [RAG Knowledge Base](#6-rag-knowledge-base)
7. [Frontend — Next.js](#7-frontend--nextjs)
8. [Database — MongoDB Schema](#8-database--mongodb-schema)
9. [Multilingual Layer — IndicTrans2](#9-multilingual-layer--indictrans2)
10. [External API Integrations](#10-external-api-integrations)
11. [Success Fee Collection Flow](#11-success-fee-collection-flow)
12. [Deployment](#12-deployment)
13. [Development Roadmap](#13-development-roadmap)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        NOMINEE (Browser/Mobile)                 │
│                    Next.js App Router Frontend                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Node.js / Express API Gateway                 │
│         Auth │ Session │ File Upload │ Webhook Handler          │
└──────┬───────────────────────┬────────────────────┬─────────────┘
       │                       │                    │
       ▼                       ▼                    ▼
┌────────────┐        ┌────────────────┐   ┌───────────────────┐
│  MongoDB   │        │  Python Agent  │   │  External APIs    │
│  Atlas     │◄──────►│  Server        │   │  Bima Sugam       │
│            │        │  (FastAPI)     │   │  DigiLocker       │
│  Cases     │        │                │   │  IndicTrans2      │
│  Sessions  │        │  LangGraph     │   │  Groq / Gemini    │
│  Docs      │        │  Orchestrator  │   │  Razorpay         │
└────────────┘        └───────┬────────┘   └───────────────────┘
                              │
              ┌───────────────┼────────────────┐───────────────┐
              ▼               ▼                ▼               ▼
      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
      │  Discovery   │ │  Document    │ │   Drafting   │ │  Escalation  │
      │  Agent       │ │  Agent       │ │   Agent      │ │  Agent       │
      └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
              │               │                │               │
              └───────────────┴────────────────┴───────────────┘
                                      │
                              ┌───────▼────────┐
                              │  ChromaDB RAG  │
                              │  Knowledge Base│
                              └────────────────┘
```

**Key design decisions:**
- Node.js handles auth, file uploads, session management, and acts as the API gateway
- Python FastAPI runs the LangGraph agent layer separately — easier to scale agents independently
- MongoDB stores all case state so agents can be stateless and resume any case at any time
- ChromaDB stores the insurer-specific knowledge base that agents query via RAG
- IndicTrans2 runs as a separate microservice for translation

---

## 2. Repository Structure

```
saarthi/
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── verify/page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── case/[id]/page.tsx
│   │   │   │   ├── chat/page.tsx
│   │   │   │   └── documents/page.tsx
│   │   │   ├── api/
│   │   │   │   └── proxy/[...path]/route.ts
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   └── LanguageSelector.tsx
│   │   │   ├── case/
│   │   │   │   ├── PolicyCard.tsx
│   │   │   │   ├── DocumentChecklist.tsx
│   │   │   │   └── ClaimStatus.tsx
│   │   │   └── ui/
│   │   └── lib/
│   │       ├── api.ts
│   │       └── store.ts
│   │
│   ├── api/                          # Node.js Express gateway
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── cases.ts
│   │   │   │   ├── documents.ts
│   │   │   │   ├── agents.ts
│   │   │   │   └── payments.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   └── upload.ts
│   │   │   ├── models/
│   │   │   │   ├── Case.ts
│   │   │   │   ├── Nominee.ts
│   │   │   │   └── Policy.ts
│   │   │   ├── services/
│   │   │   │   ├── agentBridge.ts    # calls Python FastAPI
│   │   │   │   ├── digilocker.ts
│   │   │   │   └── razorpay.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── agents/                       # Python LangGraph layer
│       ├── main.py                   # FastAPI entry point
│       ├── graph/
│       │   ├── orchestrator.py       # LangGraph graph definition
│       │   ├── state.py              # Shared state schema
│       │   └── nodes.py              # Graph node definitions
│       ├── agents/
│       │   ├── discovery.py
│       │   ├── document.py
│       │   ├── drafting.py
│       │   └── escalation.py
│       ├── rag/
│       │   ├── knowledge_base.py
│       │   ├── ingest.py
│       │   └── retriever.py
│       ├── tools/
│       │   ├── bima_sugam.py
│       │   ├── digilocker.py
│       │   └── vision.py
│       ├── translation/
│       │   └── indictrans.py
│       └── requirements.txt
│
├── knowledge/                        # RAG source documents
│   ├── insurers/
│   │   ├── lic/
│   │   │   ├── claim_procedure.md
│   │   │   ├── documents_required.md
│   │   │   └── branch_contacts.md
│   │   ├── hdfc_life/
│   │   ├── sbi_life/
│   │   ├── icici_pru/
│   │   └── kotak_life/
│   └── general/
│       ├── irdai_guidelines.md
│       ├── grievance_process.md
│       └── nominee_rights.md
│
├── docker-compose.yml
└── .env.example
```

---

## 3. Environment Setup

### Prerequisites
```bash
node >= 18
python >= 3.11
mongodb atlas account (free tier to start)
groq api key (free)
google gemini api key (free)
```

### Root `.env`
```env
# Node API
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
AGENT_SERVICE_URL=http://localhost:8000

# Python Agents
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
CHROMA_HOST=localhost
CHROMA_PORT=8001

# External APIs
DIGILOCKER_CLIENT_ID=...
DIGILOCKER_CLIENT_SECRET=...
BIMA_SUGAM_API_KEY=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

### Install everything
```bash
# Frontend
cd apps/web && npm install

# Node API
cd apps/api && npm install

# Python agents
cd apps/agents
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### `requirements.txt`
```txt
fastapi==0.111.0
uvicorn==0.30.0
langgraph==0.1.19
langchain==0.2.6
langchain-groq==0.1.6
langchain-google-genai==1.0.6
langchain-community==0.2.6
chromadb==0.5.3
sentence-transformers==3.0.1
pymongo==4.7.3
python-dotenv==1.0.1
pillow==10.3.0
httpx==0.27.0
pydantic==2.7.4
```

---

## 4. Backend — Node.js/Express API

### `apps/api/src/index.ts`
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './db';
import authRoutes from './routes/auth';
import caseRoutes from './routes/cases';
import agentRoutes from './routes/agents';
import documentRoutes from './routes/documents';
import paymentRoutes from './routes/payments';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payments', paymentRoutes);

connectDB().then(() => {
  app.listen(process.env.PORT || 4000, () => {
    console.log(`Saarthi API running on port ${process.env.PORT}`);
  });
});
```

### `apps/api/src/routes/agents.ts`
```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { AgentBridgeService } from '../services/agentBridge';

const router = Router();
const agentBridge = new AgentBridgeService();

// Start or resume a case — triggers the LangGraph orchestrator
router.post('/invoke', authenticate, async (req, res) => {
  try {
    const { caseId, userMessage, language } = req.body;

    // Stream the agent response back to frontend
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await agentBridge.invokeStream({
      caseId,
      userMessage,
      language,
      nomineeId: req.user.id,
    });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.status(500).json({ error: 'Agent invocation failed' });
  }
});

export default router;
```

### `apps/api/src/services/agentBridge.ts`
```typescript
import axios from 'axios';

export class AgentBridgeService {
  private baseUrl = process.env.AGENT_SERVICE_URL;

  async invokeStream(payload: {
    caseId: string;
    userMessage: string;
    language: string;
    nomineeId: string;
  }) {
    // Call Python FastAPI agent service with streaming
    const response = await axios.post(
      `${this.baseUrl}/agent/invoke`,
      payload,
      { responseType: 'stream' }
    );
    return response.data;
  }

  async getAgentState(caseId: string) {
    const response = await axios.get(
      `${this.baseUrl}/agent/state/${caseId}`
    );
    return response.data;
  }
}
```

### `apps/api/src/models/Case.ts`
```typescript
import mongoose from 'mongoose';

const PolicySchema = new mongoose.Schema({
  insurerName: String,
  policyNumber: String,
  policyType: String,          // life | term | accidental | group
  sumAssured: Number,
  nomineeStatus: String,       // confirmed | disputed | unknown
  claimStatus: String,         // not_started | in_progress | submitted | settled | rejected
  documentsRequired: [String],
  documentsUploaded: [String],
  claimLetterGenerated: Boolean,
  submittedAt: Date,
  settledAt: Date,
  settlementAmount: Number,
});

const CaseSchema = new mongoose.Schema({
  nomineeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Nominee' },

  // Deceased person details
  deceased: {
    name: String,
    aadhaar: String,           // encrypted
    pan: String,               // encrypted
    dateOfDeath: Date,
    employer: String,
    city: String,
    state: String,
  },

  // Case progress
  phase: {
    type: String,
    enum: ['discovery', 'documentation', 'drafting', 'submitted', 'settled', 'escalated'],
    default: 'discovery',
  },

  policies: [PolicySchema],

  // Conversation history for LangGraph memory
  conversationHistory: [{
    role: String,              // user | assistant | agent
    content: String,
    agentName: String,
    timestamp: Date,
    language: String,
  }],

  // Agent state snapshot (persisted between sessions)
  agentState: mongoose.Schema.Types.Mixed,

  language: { type: String, default: 'en' },

  // Success fee tracking
  feeAgreementSigned: { type: Boolean, default: false },
  feePercentage: { type: Number, default: 0.75 },
  feeCollected: { type: Boolean, default: false },
  feeAmount: Number,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Case = mongoose.model('Case', CaseSchema);
```

---

## 5. Agent Layer — Python + LangGraph

### `apps/agents/graph/state.py`
```python
from typing import TypedDict, Annotated, List, Optional
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    # Core case context
    case_id: str
    nominee_id: str
    language: str

    # Deceased person info
    deceased_name: str
    deceased_aadhaar: Optional[str]
    deceased_pan: Optional[str]
    deceased_employer: Optional[str]
    deceased_dod: Optional[str]

    # Conversation
    messages: Annotated[list, add_messages]

    # Discovery results
    discovered_policies: List[dict]
    discovery_complete: bool

    # Documentation
    document_checklists: dict          # { policy_id: [required_docs] }
    documents_validated: dict          # { policy_id: { doc: status } }

    # Drafting
    claim_letters_generated: dict      # { policy_id: letter_text }

    # Escalation
    escalation_needed: bool
    escalation_reason: Optional[str]
    grievance_letters: dict

    # Routing
    current_agent: str
    next_action: Optional[str]
    error: Optional[str]
```

### `apps/agents/main.py`
```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from graph.orchestrator import build_graph
from db import get_case, save_agent_state
import json

app = FastAPI()
graph = build_graph()

class InvokeRequest(BaseModel):
    case_id: str
    nominee_id: str
    user_message: str
    language: str = "en"

@app.post("/agent/invoke")
async def invoke_agent(req: InvokeRequest):
    # Load existing case state from MongoDB
    case = await get_case(req.case_id)
    
    # Reconstruct state from saved snapshot + new message
    state = {
        **case.get("agentState", {}),
        "case_id": req.case_id,
        "nominee_id": req.nominee_id,
        "language": req.language,
        "messages": [{"role": "user", "content": req.user_message}],
    }

    async def stream_response():
        async for chunk in graph.astream(state, stream_mode="values"):
            # Extract the latest assistant message
            messages = chunk.get("messages", [])
            if messages:
                last = messages[-1]
                if hasattr(last, 'content'):
                    yield f"data: {json.dumps({'content': last.content, 'agent': chunk.get('current_agent')})}\n\n"

            # Persist state after each step
            await save_agent_state(req.case_id, chunk)

    return StreamingResponse(stream_response(), media_type="text/event-stream")


@app.get("/agent/state/{case_id}")
async def get_state(case_id: str):
    case = await get_case(case_id)
    return case.get("agentState", {})
```

---

### 5.5 LangGraph Orchestration

### `apps/agents/graph/orchestrator.py`
```python
from langgraph.graph import StateGraph, END
from graph.state import AgentState
from agents.discovery import run_discovery
from agents.document import run_document_agent
from agents.drafting import run_drafting_agent
from agents.escalation import run_escalation_agent

def route_after_discovery(state: AgentState) -> str:
    if state.get("error"):
        return "escalation"
    if state.get("discovery_complete"):
        return "document"
    return "discovery"  # not done yet, loop

def route_after_document(state: AgentState) -> str:
    # Check if all required docs are validated
    all_validated = all(
        all(s == "valid" for s in docs.values())
        for docs in state.get("documents_validated", {}).values()
    )
    if all_validated:
        return "drafting"
    return "document"   # still waiting for uploads

def route_after_drafting(state: AgentState) -> str:
    if state.get("escalation_needed"):
        return "escalation"
    return END

def build_graph():
    graph = StateGraph(AgentState)

    # Add agent nodes
    graph.add_node("discovery",   run_discovery)
    graph.add_node("document",    run_document_agent)
    graph.add_node("drafting",    run_drafting_agent)
    graph.add_node("escalation",  run_escalation_agent)

    # Entry point
    graph.set_entry_point("discovery")

    # Conditional edges — this is where LangGraph shines
    graph.add_conditional_edges("discovery",  route_after_discovery)
    graph.add_conditional_edges("document",   route_after_document)
    graph.add_conditional_edges("drafting",   route_after_drafting)

    graph.add_edge("escalation", END)

    return graph.compile()
```

---

### 5.1 Discovery Agent

### `apps/agents/agents/discovery.py`
```python
from langchain_groq import ChatGroq
from langchain.prompts import ChatPromptTemplate
from tools.bima_sugam import query_bima_sugam
from tools.digilocker import fetch_digilocker_docs
from rag.retriever import retrieve_insurer_info
from graph.state import AgentState

llm = ChatGroq(model="llama3-70b-8192", temperature=0)

async def run_discovery(state: AgentState) -> dict:
    """
    Discovers all insurance policies linked to the deceased.
    Sources: Bima Sugam API, DigiLocker, employer records via RAG.
    """
    deceased_aadhaar = state.get("deceased_aadhaar")
    deceased_pan     = state.get("deceased_pan")
    deceased_employer = state.get("deceased_employer")

    discovered = []

    # 1. Query IRDAI Bima Sugam
    if deceased_aadhaar or deceased_pan:
        bima_policies = await query_bima_sugam(
            aadhaar=deceased_aadhaar,
            pan=deceased_pan
        )
        discovered.extend(bima_policies)

    # 2. Query DigiLocker for stored insurance documents
    if deceased_aadhaar:
        digi_docs = await fetch_digilocker_docs(aadhaar=deceased_aadhaar)
        # Parse insurance policies from DigiLocker docs
        for doc in digi_docs:
            if doc.get("type") == "insurance_policy":
                discovered.append({
                    "source": "digilocker",
                    "insurerName": doc.get("issuer"),
                    "policyNumber": doc.get("policy_number"),
                    "policyType": doc.get("policy_type"),
                    "sumAssured": doc.get("sum_assured"),
                })

    # 3. Check employer group insurance via RAG knowledge base
    if deceased_employer:
        employer_info = retrieve_insurer_info(
            f"group insurance policy for employees of {deceased_employer}"
        )
        if employer_info:
            # Ask LLM to extract policy details from retrieved context
            prompt = ChatPromptTemplate.from_messages([
                ("system", """You are an insurance discovery assistant.
                 Extract any group insurance policy details from the context.
                 Return JSON with: insurerName, policyType, estimatedSumAssured.
                 If no group policy found, return null."""),
                ("human", f"Context: {employer_info}\n\nEmployer: {deceased_employer}")
            ])
            response = await llm.ainvoke(prompt.format_messages())
            # Parse and add to discovered list if valid

    # Generate human-readable summary for nominee
    summary = await generate_discovery_summary(discovered, state["language"])

    return {
        "discovered_policies": discovered,
        "discovery_complete": True,
        "current_agent": "discovery",
        "messages": [{"role": "assistant", "content": summary}],
    }


async def generate_discovery_summary(policies: list, language: str) -> str:
    if not policies:
        return ("We searched all available records but could not find "
                "any insurance policies linked to the details you provided. "
                "This doesn't mean no policy exists — some older policies may "
                "not be digitized yet. Let's try contacting insurers directly.")

    policy_list = "\n".join([
        f"- {p.get('insurerName', 'Unknown insurer')}: "
        f"{p.get('policyType', 'Life')} policy "
        f"(Sum assured: Rs. {p.get('sumAssured', 'unknown'):,})"
        for p in policies
    ])

    prompt = ChatPromptTemplate.from_messages([
        ("system", f"""You are Saarthi, a compassionate insurance claims guide.
         Explain the following discovered policies to a grieving family member
         in simple, warm language. No jargon. Be gentle and clear.
         Respond in language code: {language}"""),
        ("human", f"We found these policies:\n{policy_list}\n\nExplain what this means for the family.")
    ])

    llm_response = await ChatGroq(model="llama3-70b-8192").ainvoke(
        prompt.format_messages()
    )
    return llm_response.content
```

---

### 5.2 Document Intelligence Agent

### `apps/agents/agents/document.py`
```python
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from rag.retriever import retrieve_insurer_info
from graph.state import AgentState
import base64

llm = ChatGroq(model="llama3-70b-8192", temperature=0)
vision_llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")

async def run_document_agent(state: AgentState) -> dict:
    """
    For each discovered policy:
    1. Retrieves insurer-specific document requirements via RAG
    2. Generates personalized checklist in nominee's language
    3. Validates uploaded documents via vision LLM
    """
    policies = state.get("discovered_policies", [])
    language = state.get("language", "en")
    checklists = {}
    validation_results = {}

    for policy in policies:
        policy_id = policy.get("policyNumber", policy.get("insurerName"))
        insurer = policy.get("insurerName")

        # Retrieve insurer-specific requirements from RAG
        requirements = retrieve_insurer_info(
            f"death claim documents required {insurer} nominee"
        )

        # Generate checklist via LLM
        prompt = f"""Based on this insurer's requirements:
{requirements}

Generate a simple numbered document checklist for a nominee claiming 
a {policy.get('policyType')} policy from {insurer}.
Write in {language}. Use simple words. No jargon.
Include: what the document is, where to get it, what format is needed."""

        response = await llm.ainvoke(prompt)
        checklists[policy_id] = response.content

    # Validate any documents the nominee has already uploaded
    uploaded_docs = state.get("uploaded_documents", [])
    for doc in uploaded_docs:
        validation = await validate_document(doc)
        policy_id = doc.get("policy_id")
        doc_type = doc.get("type")
        if policy_id not in validation_results:
            validation_results[policy_id] = {}
        validation_results[policy_id][doc_type] = validation

    # Generate next instruction message
    message = await generate_document_message(checklists, validation_results, language)

    return {
        "document_checklists": checklists,
        "documents_validated": validation_results,
        "current_agent": "document",
        "messages": [{"role": "assistant", "content": message}],
    }


async def validate_document(doc: dict) -> str:
    """
    Use Gemini vision to check if uploaded document photo is:
    - Legible (not blurry)
    - Complete (all four corners visible)
    - Correct type (matches expected document)
    """
    image_data = doc.get("base64_image")
    expected_type = doc.get("type")

    prompt = [
        {
            "type": "text",
            "text": f"""You are checking if a document photo is valid for an insurance claim.
Expected document type: {expected_type}

Check:
1. Is the document clearly legible? (not blurry, not too dark)
2. Are all four corners of the document visible?
3. Does it appear to be a {expected_type}?

Reply with ONLY one of: "valid", "blurry", "incomplete", "wrong_document"
Then on next line, one sentence of friendly advice if not valid."""
        },
        {
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}
        }
    ]

    response = await vision_llm.ainvoke(prompt)
    lines = response.content.strip().split('\n')
    status = lines[0].strip().lower()
    return status
```

---

### 5.3 Claim Drafting Agent

### `apps/agents/agents/drafting.py`
```python
from langchain_groq import ChatGroq
from rag.retriever import retrieve_insurer_info
from graph.state import AgentState
from datetime import date

llm = ChatGroq(model="llama3-70b-8192", temperature=0.1)

async def run_drafting_agent(state: AgentState) -> dict:
    """
    Generates ready-to-submit claim letters for each policy,
    personalized per insurer's required format.
    """
    policies = state.get("discovered_policies", [])
    nominee_name = state.get("nominee_name", "[Nominee Name]")
    deceased_name = state.get("deceased_name")
    deceased_dod  = state.get("deceased_dod")
    language = state.get("language", "en")
    generated_letters = {}

    for policy in policies:
        policy_id = policy.get("policyNumber", policy.get("insurerName"))
        insurer   = policy.get("insurerName")

        # Retrieve insurer claim letter format from RAG
        format_guide = retrieve_insurer_info(
            f"{insurer} death claim application letter format template"
        )

        prompt = f"""You are generating a formal insurance death claim letter.

Insurer format requirements:
{format_guide}

Details to include:
- Policy Number: {policy.get('policyNumber', 'to be confirmed')}
- Insurer: {insurer}
- Deceased: {deceased_name}
- Date of Death: {deceased_dod}
- Nominee/Claimant: {nominee_name}
- Claim Type: Death Claim
- Today's Date: {date.today().strftime('%d %B %Y')}

Generate a complete, formal claim letter ready to sign and submit.
Include all standard sections. Leave [BRANCH ADDRESS] as placeholder.
Write in English (will be translated separately if needed).
"""

        response = await llm.ainvoke(prompt)
        generated_letters[policy_id] = {
            "insurer": insurer,
            "letter": response.content,
            "policy_number": policy.get("policyNumber"),
            "generated_at": date.today().isoformat(),
        }

    message = await generate_drafting_message(generated_letters, language)

    return {
        "claim_letters_generated": generated_letters,
        "current_agent": "drafting",
        "messages": [{"role": "assistant", "content": message}],
    }
```

---

### 5.4 Escalation Agent

### `apps/agents/agents/escalation.py`
```python
from langchain_groq import ChatGroq
from rag.retriever import retrieve_insurer_info
from graph.state import AgentState
from datetime import date

llm = ChatGroq(model="llama3-70b-8192", temperature=0.1)

async def run_escalation_agent(state: AgentState) -> dict:
    """
    Triggered when:
    - Claim is rejected without explanation
    - Insurer has not settled within 30 days of submission
    - Nominee requests escalation
    
    Drafts:
    1. IRDAI Bima Bharosa grievance complaint
    2. Consumer Forum complaint letter
    3. Insurer's internal escalation letter
    """
    reason  = state.get("escalation_reason", "claim rejected without explanation")
    nominee = state.get("nominee_name", "[Nominee Name]")
    deceased = state.get("deceased_name")
    policies = state.get("discovered_policies", [])
    language = state.get("language", "en")
    grievance_letters = {}

    # Retrieve IRDAI grievance process from RAG
    irdai_process = retrieve_insurer_info("IRDAI Bima Bharosa grievance complaint process")

    for policy in policies:
        policy_id = policy.get("policyNumber", policy.get("insurerName"))
        insurer   = policy.get("insurerName")

        prompt = f"""Generate a formal IRDAI Bima Bharosa grievance complaint letter.

Context:
- Complainant (Nominee): {nominee}
- Deceased Policyholder: {deceased}
- Insurer: {insurer}
- Policy Number: {policy.get('policyNumber', 'unknown')}
- Grievance: {reason}
- Date: {date.today().strftime('%d %B %Y')}

IRDAI Process Reference:
{irdai_process}

Write a firm but professional complaint letter that:
1. States the facts clearly
2. Cites IRDAI regulations on claim settlement timelines (30 days)
3. Requests specific action within 15 days
4. Mentions escalation to consumer forum if unresolved

Format ready to submit to IRDAI Bima Bharosa portal."""

        response = await llm.ainvoke(prompt)
        grievance_letters[policy_id] = {
            "type": "irdai_bima_bharosa",
            "insurer": insurer,
            "letter": response.content,
        }

    message = await generate_escalation_message(grievance_letters, language)

    return {
        "grievance_letters": grievance_letters,
        "current_agent": "escalation",
        "messages": [{"role": "assistant", "content": message}],
    }
```

---

## 6. RAG Knowledge Base

### `apps/agents/rag/ingest.py`
```python
"""
Run this script once to build the ChromaDB knowledge base
from the /knowledge directory.
"""
import chromadb
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

KNOWLEDGE_DIR = "../../../knowledge"
CHROMA_PERSIST_DIR = "./chroma_db"

def build_knowledge_base():
    # Load all markdown files from knowledge directory
    loader = DirectoryLoader(
        KNOWLEDGE_DIR,
        glob="**/*.md",
        loader_cls=TextLoader
    )
    documents = loader.load()
    print(f"Loaded {len(documents)} knowledge documents")

    # Split into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )
    chunks = splitter.split_documents(documents)
    print(f"Created {len(chunks)} chunks")

    # Embed using sentence-transformers (free, local)
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
        # Multilingual model — handles Hindi, Telugu, Tamil etc.
    )

    # Build and persist ChromaDB
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=CHROMA_PERSIST_DIR,
    )
    vectorstore.persist()
    print(f"Knowledge base built and persisted at {CHROMA_PERSIST_DIR}")

if __name__ == "__main__":
    build_knowledge_base()
```

### `apps/agents/rag/retriever.py`
```python
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

CHROMA_PERSIST_DIR = "./chroma_db"

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)

vectorstore = Chroma(
    persist_directory=CHROMA_PERSIST_DIR,
    embedding_function=embeddings,
)
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

def retrieve_insurer_info(query: str) -> str:
    docs = retriever.invoke(query)
    return "\n\n".join([d.page_content for d in docs])
```

### Sample knowledge file: `knowledge/insurers/lic/claim_procedure.md`
```markdown
# LIC Death Claim Procedure

## How to File a Death Claim with LIC

### Step 1: Intimation
Intimate the nearest LIC branch office immediately after the death.
Provide: Policy number, name of life assured, date of death, cause of death.
Intimation can be given in person, by letter, or via LIC's online portal.

### Step 2: Documents Required (Standard)
- Claim form (Form No. 3783) — available at any LIC branch or website
- Original policy bond
- Death certificate issued by municipal authority (original)
- Claimant's identity proof (Aadhaar card)
- Claimant's address proof
- Cancelled cheque or bank passbook copy (for NEFT)
- NEFT mandate form

### Step 3: Additional Documents (if required)
- If death within 3 years of policy issue: medical records, hospital records
- If accidental death: FIR copy, post-mortem report, police inquest report
- If employer group policy: employer certificate

### Step 4: Submission
Submit all documents to the servicing branch where policy is registered.
LIC must settle within 30 days of receiving all documents (IRDAI mandate).

### Branch Helpline
Toll-free: 1800-227-717
Email: claims@licindia.in

### Online Tracking
LIC customer portal: licindia.in → e-Services → Claim Status
```

---

## 7. Frontend — Next.js

### `apps/web/app/(dashboard)/chat/page.tsx`
```tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { LanguageSelector } from '@/components/chat/LanguageSelector';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'mr', label: 'मराठी' },
  { code: 'bn', label: 'বাংলা' },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Namaste. I am Saarthi. I am here to help you find and claim all insurance policies that belong to your family. You do not need to know anything about insurance — I will guide you step by step. Can you start by telling me the name of the person who has passed away?',
      agent: 'saarthi',
    }
  ]);
  const [input, setInput]         = useState('');
  const [language, setLanguage]   = useState('en');
  const [loading, setLoading]     = useState(false);
  const [caseId, setCaseId]       = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Start streaming from agent
      const response = await fetch('/api/agents/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, userMessage, language }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let agentMessage = '';

      // Add empty assistant message to stream into
      setMessages(prev => [...prev, { role: 'assistant', content: '', agent: 'thinking' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.replace('data: ', '');
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            agentMessage += parsed.content || '';
            // Update last message in real-time
            setMessages(prev => [
              ...prev.slice(0, -1),
              { role: 'assistant', content: agentMessage, agent: parsed.agent }
            ]);
          } catch {}
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="font-semibold text-lg">Saarthi</h1>
          <p className="text-sm text-gray-500">Your insurance claims guide</p>
        </div>
        <LanguageSelector
          languages={LANGUAGES}
          selected={language}
          onChange={setLanguage}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <div className="animate-pulse">Saarthi is thinking...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 8. Database — MongoDB Schema

### Collections Summary

```
nominees          — user accounts (phone OTP auth)
cases             — one case per deceased person
policies          — discovered policies (embedded in case)
documents         — uploaded document metadata + S3 refs
claim_letters     — generated letters per policy
grievances        — escalation letters
payments          — success fee tracking
```

### Indexes to create
```javascript
// In MongoDB Atlas, create these indexes

// cases
db.cases.createIndex({ nomineeId: 1 })
db.cases.createIndex({ "deceased.aadhaar": 1 })
db.cases.createIndex({ "deceased.pan": 1 })
db.cases.createIndex({ phase: 1, updatedAt: -1 })

// For finding stale cases needing escalation
db.cases.createIndex({ 
  "policies.claimStatus": 1, 
  "policies.submittedAt": 1 
})
```

---

## 9. Multilingual Layer — IndicTrans2

### `apps/agents/translation/indictrans.py`
```python
"""
IndicTrans2 is an open-source multilingual translation model
from AI4Bharat covering 22 Indian languages.
Run as a separate service or import directly.
"""
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import torch

SUPPORTED_LANGUAGES = {
    "hi": "hin_Deva",   # Hindi
    "te": "tel_Telu",   # Telugu
    "ta": "tam_Taml",   # Tamil
    "mr": "mar_Deva",   # Marathi
    "bn": "ben_Beng",   # Bengali
    "gu": "guj_Gujr",   # Gujarati
    "kn": "kan_Knda",   # Kannada
    "ml": "mal_Mlym",   # Malayalam
    "en": "eng_Latn",   # English
}

class IndicTranslator:
    def __init__(self):
        model_name = "ai4bharat/indictrans2-en-indic-1B"
        self.tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(
            model_name, trust_remote_code=True
        )
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = self.model.to(self.device)

    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if source_lang == target_lang:
            return text

        src_code = SUPPORTED_LANGUAGES.get(source_lang, "eng_Latn")
        tgt_code = SUPPORTED_LANGUAGES.get(target_lang, "eng_Latn")

        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=512,
        ).to(self.device)

        with torch.no_grad():
            generated = self.model.generate(
                **inputs,
                num_beams=4,
                max_length=512,
                forced_bos_token_id=self.tokenizer.convert_tokens_to_ids(tgt_code),
            )

        return self.tokenizer.batch_decode(generated, skip_special_tokens=True)[0]

# Singleton
translator = IndicTranslator()

def translate_to_user_language(text: str, target_lang: str) -> str:
    if target_lang == "en":
        return text
    return translator.translate(text, source_lang="en", target_lang=target_lang)
```

> **Note:** For MVP, use Groq/Gemini directly with a language instruction in the system prompt. IndicTrans2 is the production-grade replacement for true regional accuracy.

---

## 10. External API Integrations

### `apps/agents/tools/bima_sugam.py`
```python
import httpx
import os

BIMA_SUGAM_BASE = "https://api.bimasugam.in/v1"  # Actual endpoint TBC

async def query_bima_sugam(aadhaar: str = None, pan: str = None) -> list:
    """
    Query IRDAI's Bima Sugam policy repository.
    Returns list of policies linked to the person.
    
    Note: In MVP phase, if API access is restricted,
    fall back to web scraping the Bima Sugam portal
    or manually maintained insurer contact list.
    """
    headers = {
        "Authorization": f"Bearer {os.getenv('BIMA_SUGAM_API_KEY')}",
        "Content-Type": "application/json",
    }
    payload = {}
    if aadhaar: payload["aadhaar"] = aadhaar
    if pan: payload["pan"] = pan

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{BIMA_SUGAM_BASE}/policy/search",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("policies", [])
    except httpx.HTTPError:
        # Fallback: return empty, agent will try other sources
        return []
```

### `apps/api/src/services/razorpay.ts` — Success Fee Collection
```typescript
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function createSuccessFeeOrder(
  claimAmount: number,
  feePercentage: number,
  caseId: string
) {
  const feeAmount = Math.round(claimAmount * (feePercentage / 100));

  const order = await razorpay.orders.create({
    amount: feeAmount * 100,            // Razorpay uses paise
    currency: 'INR',
    receipt: `saarthi_${caseId}`,
    notes: {
      caseId,
      type: 'success_fee',
      claimAmount,
      feePercentage,
    },
  });

  return order;
}

export async function verifyPayment(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  const crypto = require('crypto');
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}
```

---

## 11. Success Fee Collection Flow

```
Claim Settled by Insurer
         │
         ▼
Saarthi detects settlement (via nominee confirmation or insurer webhook)
         │
         ▼
Calculate fee: claimAmount × 0.75%
         │
         ▼
Create Razorpay order
         │
         ▼
Send payment link to nominee via WhatsApp/SMS
(message: "Your claim of Rs. X has been settled. 
Saarthi's service fee of Rs. Y is now due. 
Pay here: [link]")
         │
         ▼
Nominee pays → Razorpay webhook confirms
         │
         ▼
Case marked "fee_collected" in MongoDB
         │
         ▼
Generate receipt + thank you message
```

---

## 12. Deployment

### `docker-compose.yml`
```yaml
version: '3.8'
services:
  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:4000

  api:
    build: ./apps/api
    ports:
      - "4000:4000"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - AGENT_SERVICE_URL=http://agents:8000
    depends_on:
      - agents

  agents:
    build: ./apps/agents
    ports:
      - "8000:8000"
    environment:
      - GROQ_API_KEY=${GROQ_API_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - CHROMA_HOST=chroma
    depends_on:
      - chroma

  chroma:
    image: chromadb/chroma:latest
    ports:
      - "8001:8000"
    volumes:
      - chroma_data:/chroma/chroma

volumes:
  chroma_data:
```

### Production deployment
```
Frontend  → Vercel (free tier → pro as traffic grows)
API       → Railway.app (free tier → $5/mo starter)
Agents    → Railway.app (separate service, Python)
ChromaDB  → Railway.app (persistent volume)
MongoDB   → Atlas M0 free → M10 at scale
```

---

## 13. Development Roadmap

### Month 1 — Core MVP
```
Week 1: Repo setup, MongoDB schema, Node.js API skeleton
Week 2: LangGraph orchestrator + Discovery Agent (mock Bima Sugam)
Week 3: Document Agent + Vision validation + Drafting Agent
Week 4: Next.js chat UI + streaming integration + end-to-end test
```

### Month 2 — Real Integrations
```
Week 1: Bima Sugam API integration (or fallback scraper)
Week 2: DigiLocker OAuth integration
Week 3: RAG knowledge base — ingest all 5 insurer docs
Week 4: IndicTrans2 integration + Hindi/Telugu testing
```

### Month 3 — Pilot
```
Week 1: Razorpay success fee flow
Week 2: WhatsApp notification via Twilio/WATI
Week 3: 10 real family pilot cases (friends/family network)
Week 4: Bug fixes, agent accuracy improvements, feedback loop
```

### Month 4–6 — B2B & Scale
```
Insurer SaaS dashboard (claim analytics, settlement reports)
IRDAI Bima Bharosa API integration for escalations
Premium tier (human agent handoff via WhatsApp)
```

---

> **One final note on implementability:** The entire MVP can be built and demoed without real Bima Sugam API access. Use a mock response layer for the hackathon demo — simulate discovery of 2–3 policies from a demo deceased person's PAN. The agent logic, conversation flow, document validation, and claim letter generation are all fully implementable right now with existing APIs. The integration depth improves post-hackathon.
