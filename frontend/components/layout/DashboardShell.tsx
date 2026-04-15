"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

  const navItems = useMemo(
    () => [
      { href: "/", label: "Dashboard" },
      { href: "/chat", label: "Chat" },
      { href: "/documents", label: "Documents" }
    ],
    []
  );

  if (!ready) {
    return <div className="loading-screen">Opening your Saarthi workspace...</div>;
  }

  return (
    <main className="page-shell">
      <header className="top-nav">
        <div>
          <div className="eyebrow">Saarthi Workspace</div>
          <h1 className="section-title">Welcome, {nomineeName}</h1>
        </div>
        <div className="nav-row">
          <nav className="nav-links">
            {navItems.map((item) => (
              <Link
                className={`nav-link ${pathname === item.href ? "active" : ""}`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            className="ghost-button"
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
      {children}
    </main>
  );
}
