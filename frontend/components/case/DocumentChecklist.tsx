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
    <section className="doc-card">
      <div className="split">
        <h4>{title}</h4>
        <span className="badge">{requirements.length} docs</span>
      </div>
      <div className="doc-list">
        {requirements.map((requirement) => (
          <div className="split" key={requirement}>
            <span>{requirement}</span>
            <span className="badge subtle-badge">
              {validations?.[requirement] ?? "pending"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
