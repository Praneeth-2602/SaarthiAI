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
    <section className="soft-card">
      <div className="eyebrow">Case progress</div>
      <h3>Current phase: {phase.replaceAll("_", " ")}</h3>
      <div className="summary-strip">
        <div className="metric-tile">
          <span>{policyCount}</span>
          <small>policies</small>
        </div>
        <div className="metric-tile">
          <span>{lettersCount}</span>
          <small>drafts</small>
        </div>
      </div>
      <p className="small-copy">
        {readyForDrafting
          ? "The uploaded documents look complete enough to review draft letters."
          : "More documents are still needed before letters can be finalized."}
      </p>
    </section>
  );
}
