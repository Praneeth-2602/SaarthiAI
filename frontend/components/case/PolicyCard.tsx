import type { Policy } from "@/lib/types";

export function PolicyCard({ policy }: { policy: Policy }) {
  return (
    <article className="policy-card">
      <div className="card-topline">
        <div>
          <div className="eyebrow">{policy.insurerName}</div>
          <h3>{policy.policyNumber}</h3>
        </div>
        <span className="status-pill">{policy.policyType}</span>
      </div>
      <p className="small-copy">
        Sum assured: {policy.sumAssured ? `Rs. ${policy.sumAssured.toLocaleString("en-IN")}` : "To be confirmed"}
      </p>
      <p className="small-copy">Claim status: {policy.claimStatus ?? "in progress"}</p>
    </article>
  );
}
