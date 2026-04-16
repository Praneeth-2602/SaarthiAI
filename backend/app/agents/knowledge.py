from __future__ import annotations

from pathlib import Path

from ..config import settings


def search_knowledge(query: str, insurer_name: str | None = None) -> str:
    terms = [term.lower() for term in query.split() if len(term) > 3]
    preferred_paths: list[Path] = []
    if insurer_name:
        insurer_dir = settings.knowledge_dir / "insurers" / insurer_name.strip().lower().replace(" ", "_")
        if insurer_dir.exists():
            preferred_paths.extend(sorted(insurer_dir.glob("*.md")))

    preferred_paths.extend(sorted((settings.knowledge_dir / "general").glob("*.md")))
    if not preferred_paths:
        return ""

    snippets: list[str] = []
    for path in preferred_paths:
        text = path.read_text(encoding="utf-8")
        lowered = text.lower()
        if not terms or any(term in lowered for term in terms):
            snippets.append(text[:1400])
        if len(snippets) == 2:
            break
    return "\n\n".join(snippets)
