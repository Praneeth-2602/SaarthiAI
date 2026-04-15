from rag.retriever import retrieve_required_documents


def test_retrieve_required_documents_returns_seeded_insurer_content():
    requirements, context = retrieve_required_documents("LIC", "term")

    assert requirements
    assert "death certificate" in context.lower()
