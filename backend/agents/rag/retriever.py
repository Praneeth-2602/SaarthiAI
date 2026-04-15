import os
import re
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parents[3]
KNOWLEDGE_DIR = ROOT_DIR / "knowledge"
CHROMA_PERSIST_DIR = Path(
    os.getenv("CHROMA_PERSIST_DIR", str(Path(__file__).resolve().parents[1] / "chroma_db"))
)


def _read_markdown_documents() -> list[dict[str, str]]:
    documents: list[dict[str, str]] = []
    for path in KNOWLEDGE_DIR.rglob("*.md"):
        documents.append({"path": str(path), "content": path.read_text(encoding="utf-8")})
    return documents


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def _fallback_search(query: str, limit: int = 3) -> list[dict[str, str]]:
    query_tokens = _tokenize(query)
    scored: list[tuple[int, dict[str, str]]] = []
    for document in _read_markdown_documents():
        content_tokens = _tokenize(document["content"])
        score = len(query_tokens & content_tokens)
        if score:
            scored.append((score, document))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [document for _, document in scored[:limit]]


def retrieve_insurer_info(query: str, limit: int = 3) -> str:
    if CHROMA_PERSIST_DIR.exists():
        try:
            from langchain_community.embeddings import HuggingFaceEmbeddings
            from langchain_community.vectorstores import Chroma

            embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
            )
            vectorstore = Chroma(
                persist_directory=str(CHROMA_PERSIST_DIR),
                embedding_function=embeddings,
            )
            docs = vectorstore.as_retriever(search_kwargs={"k": limit}).invoke(query)
            return "\n\n".join(getattr(doc, "page_content", "") for doc in docs)
        except Exception:
            pass

    fallback_docs = _fallback_search(query, limit=limit)
    return "\n\n".join(document["content"] for document in fallback_docs)


def _extract_bullets(text: str) -> list[str]:
    items: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("- "):
            items.append(stripped[2:].strip())
    return items


def retrieve_required_documents(insurer_name: str, policy_type: str) -> tuple[list[str], str]:
    query = f"{insurer_name} death claim documents required for nominee {policy_type}"
    context = retrieve_insurer_info(query)
    items = _extract_bullets(context)
    if items:
        return items[:8], context

    return (
        [
            "Death certificate",
            "Claim form signed by nominee",
            "Policy bond or policy schedule",
            "Nominee identity proof",
            "Cancelled cheque or bank passbook copy",
        ],
        context,
    )
