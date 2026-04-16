export function DocumentChecklist({
  title,
  requirements,
  validations
}: {
  title: string;
  requirements: string[];
  validations?: Record<string, string>;
}) {
  return (
    <section className="checklist-card">
      <div className="card-topline">
        <h4>{title}</h4>
        <span className="status-pill">{requirements.length} docs</span>
      </div>
      <div className="list-stack">
        {requirements.map((requirement) => (
          <div className="checklist-row" key={requirement}>
            <span>{requirement}</span>
            <span className={`status-pill ${validations?.[requirement] === "valid" ? "is-valid" : "is-pending"}`}>
              {validations?.[requirement] ?? "pending"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
