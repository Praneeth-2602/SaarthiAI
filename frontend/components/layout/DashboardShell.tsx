"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, getSession } from "@/lib/store";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [nomineeName, setNomineeName] = useState<string>("Nominee");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setNomineeName(session.nominee.name ?? session.nominee.phone);
    setReady(true);
  }, [router]);

  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/chat", label: "Chat" },
    { href: "/documents", label: "Documents" }
  ] as const;

  if (!ready) {
    return <div className="loading-screen">Opening your Saarthi workspace...</div>;
  }

  return (
    <main className="dashboard-shell">
      <header className="shell-header">
        <div className="brand-lockup">
          <div className="eyebrow">Saarthi Workspace</div>
          <h1>Welcome, {nomineeName}</h1>
          <p className="header-copy">A simpler workspace for policy discovery, documents, and letters.</p>
        </div>
        <div className="shell-actions">
          <nav className="shell-nav">
            {navItems.map((item) => (
              <Link
                className={`nav-chip ${pathname === item.href ? "active" : ""}`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            className="secondary-button"
            onClick={() => {
              clearSession();
              router.replace("/login");
            }}
            type="button"
          >
            Sign out
          </button>
        </div>
      </header>
      <section className="shell-main">{children}</section>
    </main>
  );
}
