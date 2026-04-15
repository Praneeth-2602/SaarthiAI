import type { Policy } from "@/lib/types";

export function PolicyCard({ policy }: { policy: Policy }) {
  return (
    <article className="policy-card">
      <div className="split">
        <div>
          <div className="eyebrow">{policy.insurerName}</div>
          <h3 style={{ marginBottom: 4 }}>{policy.policyNumber}</h3>
        </div>
        <span className="badge subtle-badge">{policy.policyType}</span>
      </div>
      <p className="muted small">
        Sum assured: {policy.sumAssured ? `Rs. ${policy.sumAssured.toLocaleString("en-IN")}` : "To be confirmed"}
      </p>
      <p className="muted small">Claim status: {policy.claimStatus ?? "in_progress"}</p>
    </article>
  );
}
