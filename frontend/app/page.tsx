"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardHome } from "@/components/layout/DashboardHome";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getSession } from "@/lib/store";

export default function HomePage() {
  const [hasSession, setHasSession] = useState(false);
  const [checkedSession, setCheckedSession] = useState(false);

  useEffect(() => {
    setHasSession(Boolean(getSession()));
    setCheckedSession(true);
  }, []);

  if (!checkedSession) {
    return <div className="loading-screen">Loading Saarthi...</div>;
  }

  if (hasSession) {
    return (
      <DashboardShell>
        <DashboardHome />
      </DashboardShell>
    );
  }

  return (
    <main className="public-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="eyebrow">Life Insurance Claim Support</div>
          <h1>A calmer way to help families finish the claim process.</h1>
          <p className="lead">
            Saarthi guides nominees through policy discovery, document collection, and
            claim-letter drafting with simple steps and gentle language.
          </p>
          <div className="action-row">
            <Link className="primary-button" href="/login">
              Start securely
            </Link>
            <a className="secondary-button" href="#how-it-works">
              See how it works
            </a>
          </div>
          <div className="trust-row">
            <span className="stat-pill">Policy discovery</span>
            <span className="stat-pill">Document checklist</span>
            <span className="stat-pill">Claim letter drafts</span>
          </div>
        </div>
        <div className="hero-card">
          <div className="card-kicker">Designed for moments of grief</div>
          <h2>One steady workspace, not a maze of forms.</h2>
          <div className="gentle-list">
            <div className="gentle-item">
              <strong>Step 1</strong>
              <span>Start with only what the family already knows.</span>
            </div>
            <div className="gentle-item">
              <strong>Step 2</strong>
              <span>See which documents matter for each insurer.</span>
            </div>
            <div className="gentle-item">
              <strong>Step 3</strong>
              <span>Review draft letters once the paperwork is ready.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-strip" id="how-it-works">
        <article className="soft-card">
          <div className="card-kicker">Clear next step</div>
          <h3>No insurance jargon required</h3>
          <p>
            The experience keeps the language plain so families can focus on action, not
            decoding process terms.
          </p>
        </article>
        <article className="soft-card">
          <div className="card-kicker">Mobile first</div>
          <h3>Works well on a phone</h3>
          <p>
            Key actions stay large, readable, and easy to reach even when everything is
            being done from one device.
          </p>
        </article>
        <article className="soft-card">
          <div className="card-kicker">Structured progress</div>
          <h3>From discovery to submission</h3>
          <p>
            Each case keeps policies, uploads, statuses, and letters in one place so the
            journey feels manageable.
          </p>
        </article>
      </section>
    </main>
  );
}
