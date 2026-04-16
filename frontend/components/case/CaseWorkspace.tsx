"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getCase, uploadDocument } from "@/lib/api";
import { setCurrentCaseId } from "@/lib/store";
import type { CaseRecord } from "@/lib/types";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ClaimStatus } from "@/components/case/ClaimStatus";
import { DocumentChecklist } from "@/components/case/DocumentChecklist";
import { PolicyCard } from "@/components/case/PolicyCard";

export function CaseWorkspace({ caseId }: { caseId: string }) {
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState("");
  const [documentType, setDocumentType] = useState("Death certificate");
  const [error, setError] = useState<string | null>(null);

  const refreshCase = useCallback(async () => {
    const nextCase = await getCase(caseId);
    setCaseRecord(nextCase);
    setCurrentCaseId(caseId);
    setSelectedPolicy((current) => current || nextCase.policies[0]?.policyNumber || "");
  }, [caseId]);

  useEffect(() => {
    void refreshCase();
  }, [refreshCase]);

  const uploadOptions = useMemo(() => {
    if (!caseRecord?.agentState?.document_requirements) {
      return [];
    }

    return Object.values(caseRecord.agentState.document_requirements)
      .flat()
      .filter((value, index, values) => values.indexOf(value) === index);
  }, [caseRecord]);

  if (!caseRecord) {
    return <div className="soft-card">Loading case details...</div>;
  }

  const letters = Object.values(caseRecord.agentState?.claim_letters_generated ?? {});
  const validations = caseRecord.agentState?.documents_validated ?? {};
  const documentRequirements = caseRecord.agentState?.document_requirements ?? {};

  return (
    <div className="case-page-grid">
      <div className="primary-column">
        <section className="soft-card case-hero">
          <div className="card-topline">
            <div>
              <div className="eyebrow">Case file</div>
              <h2>{caseRecord.deceased.name}</h2>
            </div>
            <span className="status-pill">{caseRecord.phase.replaceAll("_", " ")}</span>
          </div>
          <div className="summary-strip">
            <div className="detail-card">
              <span>Date of death</span>
              <strong>{caseRecord.deceased.dateOfDeath?.slice(0, 10) || "Not provided"}</strong>
            </div>
            <div className="detail-card">
              <span>Employer</span>
              <strong>{caseRecord.deceased.employer || "Not provided"}</strong>
            </div>
          </div>
        </section>

        <ChatPanel
          caseId={caseRecord._id}
          initialLanguage={caseRecord.language}
          initialMessages={caseRecord.conversationHistory}
          onConversationFinished={refreshCase}
        />
      </div>

      <div className="secondary-column">
        <ClaimStatus
          lettersCount={letters.length}
          phase={caseRecord.phase}
          policyCount={caseRecord.policies.length}
          readyForDrafting={Boolean(caseRecord.agentState?.ready_for_drafting)}
        />

        <section className="soft-card">
          <div className="card-topline">
            <div>
              <div className="eyebrow">Discovered policies</div>
              <h2>Coverage summary</h2>
            </div>
          </div>
          <div className="policy-list">
            {caseRecord.policies.length ? (
              caseRecord.policies.map((policy) => (
                <PolicyCard key={policy.policyNumber} policy={policy} />
              ))
            ) : (
              <div className="empty-state">
                No policies are attached yet. Ask Saarthi to check the provided PAN or Aadhaar.
              </div>
            )}
          </div>
        </section>

        <section className="soft-card">
          <div className="eyebrow">Document workspace</div>
          <h2>Uploads and validation</h2>
          <p className="section-copy">Choose the policy, upload the document, and Saarthi will refresh the checklist.</p>
          <form
            className="stack-form"
            onSubmit={async (event) => {
              event.preventDefault();
              const formElement = event.currentTarget;
              const fileInput = formElement.elements.namedItem("file") as HTMLInputElement | null;
              if (!fileInput?.files?.[0]) {
                setError("Please choose a document to upload.");
                return;
              }

              try {
                setUploading(true);
                setError(null);
                const formData = new FormData();
                formData.set("caseId", caseRecord._id);
                if (selectedPolicy) {
                  formData.set("policyId", selectedPolicy);
                }
                formData.set("documentType", documentType);
                formData.set("file", fileInput.files[0]);
                await uploadDocument(formData);
                fileInput.value = "";
                await refreshCase();
              } catch (uploadError) {
                setError(
                  uploadError instanceof Error ? uploadError.message : "Upload failed."
                );
              } finally {
                setUploading(false);
              }
            }}
          >
            <label className="label">
              Policy
              <select
                className="field"
                onChange={(event) => setSelectedPolicy(event.target.value)}
                value={selectedPolicy}
              >
                {!caseRecord.policies.length ? (
                  <option value="">No policy discovered yet</option>
                ) : null}
                {caseRecord.policies.map((policy) => (
                  <option key={policy.policyNumber} value={policy.policyNumber}>
                    {policy.insurerName} - {policy.policyNumber}
                  </option>
                ))}
              </select>
            </label>
            <label className="label">
              Document type
              <select
                className="field"
                onChange={(event) => setDocumentType(event.target.value)}
                value={documentType}
              >
                {(uploadOptions.length ? uploadOptions : ["Death certificate", "Nominee identity proof"]).map(
                  (option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  )
                )}
              </select>
            </label>
            <label className="label">
              File
              <input accept=".pdf,image/*" className="field" name="file" type="file" />
            </label>
            {error ? <div className="inline-error">{error}</div> : null}
            <button className="primary-button" disabled={uploading} type="submit">
              {uploading ? "Uploading..." : "Upload document"}
            </button>
          </form>

          <div className="checklist-list">
            {caseRecord.policies.map((policy) => (
              <DocumentChecklist
                key={policy.policyNumber}
                requirements={documentRequirements[policy.policyNumber] ?? []}
                title={`${policy.insurerName} checklist`}
                validations={validations[policy.policyNumber]}
              />
            ))}
          </div>
        </section>

        <section className="soft-card">
          <div className="eyebrow">Claim letters</div>
          <h2>Drafts ready to review</h2>
          <div className="list-stack">
            {letters.length ? (
              letters.map((letter) => (
                <article className="letter-box" key={letter.policy_number}>
                  <div className="card-topline">
                    <strong>{letter.insurer}</strong>
                    <span className="status-pill is-valid">{letter.generated_at}</span>
                  </div>
                  <pre style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{letter.letter}</pre>
                </article>
              ))
            ) : (
              <div className="empty-state">
                Draft claim letters appear here after Saarthi confirms the uploaded documents are sufficient.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
