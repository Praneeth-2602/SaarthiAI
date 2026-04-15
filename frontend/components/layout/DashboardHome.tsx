"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCase, listCases } from "@/lib/api";
import type { CaseRecord } from "@/lib/types";

export function DashboardHome() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [language, setLanguage] = useState("en");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    pan: "",
    aadhaar: "",
    dateOfDeath: "",
    employer: "",
    city: "",
    state: ""
  });

  useEffect(() => {
    void listCases()
      .then((response) => setCases(response.items))
      .catch((nextError) =>
        setError(nextError instanceof Error ? nextError.message : "Unable to load cases.")
      );
  }, []);

  return (
    <div className="dashboard-grid">
      <section className="panel">
        <div className="eyebrow">Create a new case</div>
        <h2 className="section-title">Start with what the family already knows</h2>
        <form
          className="stack"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              setLoading(true);
              setError(null);
              const created = await createCase({
                language,
                deceased: {
                  name: form.name,
                  pan: form.pan,
                  aadhaar: form.aadhaar,
                  dateOfDeath: form.dateOfDeath,
                  employer: form.employer,
                  city: form.city,
                  state: form.state
                }
              });
              router.push(`/case/${created._id}`);
            } catch (createError) {
              setError(createError instanceof Error ? createError.message : "Unable to create case.");
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className="grid-2">
            <label className="label">
              Deceased name
              <input
                className="input"
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                value={form.name}
              />
            </label>
            <label className="label">
              Preferred language
              <select className="select" onChange={(event) => setLanguage(event.target.value)} value={language}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="te">Telugu</option>
                <option value="ta">Tamil</option>
              </select>
            </label>
            <label className="label">
              PAN
              <input
                className="input"
                onChange={(event) => setForm((current) => ({ ...current, pan: event.target.value }))}
                value={form.pan}
              />
            </label>
            <label className="label">
              Aadhaar
              <input
                className="input"
                onChange={(event) => setForm((current) => ({ ...current, aadhaar: event.target.value }))}
                value={form.aadhaar}
              />
            </label>
            <label className="label">
              Date of death
              <input
                className="input"
                onChange={(event) => setForm((current) => ({ ...current, dateOfDeath: event.target.value }))}
                type="date"
                value={form.dateOfDeath}
              />
            </label>
            <label className="label">
              Employer
              <input
                className="input"
                onChange={(event) => setForm((current) => ({ ...current, employer: event.target.value }))}
                value={form.employer}
              />
            </label>
            <label className="label">
              City
              <input
                className="input"
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                value={form.city}
              />
            </label>
            <label className="label">
              State
              <input
                className="input"
                onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
                value={form.state}
              />
            </label>
          </div>
          {error ? <div className="badge">{error}</div> : null}
          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Creating..." : "Create case and open workspace"}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="eyebrow">Resume existing work</div>
        <h2 className="section-title">Recent cases</h2>
        <div className="card-list">
          {cases.length ? (
            cases.map((caseRecord) => (
              <Link className="policy-card" href={`/case/${caseRecord._id}`} key={caseRecord._id}>
                <div className="split">
                  <strong>{caseRecord.deceased.name}</strong>
                  <span className="badge">{caseRecord.phase}</span>
                </div>
                <p className="muted small">
                  {caseRecord.deceased.dateOfDeath?.slice(0, 10) || "Date not added"} •{" "}
                  {caseRecord.policies.length} policies
                </p>
              </Link>
            ))
          ) : (
            <div className="empty-state">Your first case will appear here after you create it.</div>
          )}
        </div>
      </section>
    </div>
  );
}
