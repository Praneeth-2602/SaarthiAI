export function ClaimStatus({
  phase,
  policyCount,
  readyForDrafting,
  lettersCount
}: {
  phase: string;
  policyCount: number;
  readyForDrafting: boolean;
  lettersCount: number;
}) {
  return (
    <section className="status-card">
      <div className="eyebrow">Case Progress</div>
      <h3>Current phase: {phase}</h3>
      <p className="muted">
        {policyCount} policies tracked, {lettersCount} draft letters prepared,{" "}
        {readyForDrafting ? "documents look ready for drafting." : "more documents are still needed."}
      </p>
    </section>
  );
}
