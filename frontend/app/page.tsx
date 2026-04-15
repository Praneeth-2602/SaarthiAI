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
    <main className="page-shell">
      <section className="hero">
        <div className="eyebrow">Insurance Claims Navigator</div>
        <h1>Saarthi guides families through the claim journey.</h1>
        <p>
          Discover policies, understand insurer document requirements, validate uploads,
          and prepare draft claim letters from one calm workspace.
        </p>
        <div className="toolbar">
          <Link className="primary-button" href="/login">
            Start with secure login
          </Link>
          <Link className="pill-button" href="/documents">
            Open document hub
          </Link>
        </div>
      </section>
    </main>
  );
}
