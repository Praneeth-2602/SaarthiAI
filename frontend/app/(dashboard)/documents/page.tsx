"use client";

import { useEffect, useState } from "react";
import { listDocuments } from "@/lib/api";
import { getCurrentCaseId } from "@/lib/store";
import type { DocumentRecord } from "@/lib/types";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const caseId = getCurrentCaseId();
    if (!caseId) {
      return;
    }

    void listDocuments(caseId)
      .then((response) => setDocuments(response.items))
      .catch((nextError) =>
        setError(nextError instanceof Error ? nextError.message : "Unable to load documents.")
      );
  }, []);

  return (
    <section className="panel">
      <div className="eyebrow">Document hub</div>
      <h2 className="section-title">Latest uploads</h2>
      {error ? <div className="badge">{error}</div> : null}
      <div className="card-list">
        {documents.length ? (
          documents.map((document) => (
            <article className="doc-card" key={document._id}>
              <div className="split">
                <strong>{document.originalName}</strong>
                <span className="badge subtle-badge">{document.validationStatus}</span>
              </div>
              <p className="muted small">
                {document.documentType} • {document.mimeType} • {(document.size / 1024).toFixed(1)} KB
              </p>
            </article>
          ))
        ) : (
          <div className="empty-state">
            Upload documents from any case workspace to see them here.
          </div>
        )}
      </div>
    </section>
  );
}
