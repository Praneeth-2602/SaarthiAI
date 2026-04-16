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
    <section className="soft-card">
      <div className="eyebrow">Document hub</div>
      <h2>Latest uploads</h2>
      <p className="section-copy">Documents from the most recently opened case appear here.</p>
      {error ? <div className="inline-error">{error}</div> : null}
      <div className="list-stack">
        {documents.length ? (
          documents.map((document) => (
            <article className="checklist-card" key={document._id}>
              <div className="card-topline">
                <strong>{document.originalName}</strong>
                <span className="status-pill">{document.validationStatus}</span>
              </div>
              <p className="small-copy">
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
