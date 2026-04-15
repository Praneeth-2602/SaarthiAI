"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { verifyOtp } from "@/lib/api";
import { getPendingOtp, getPendingPhone, saveSession } from "@/lib/store";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? getPendingPhone() ?? "";
  const debugOtp = getPendingOtp();
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <main className="page-shell">
      <section className="panel" style={{ maxWidth: 640, margin: "0 auto" }}>
        <div className="eyebrow">Verify access</div>
        <h1 className="section-title">Complete sign-in</h1>
        <p className="muted">Use the OTP sent for {phone || "your phone number"}.</p>
        {debugOtp ? <div className="badge">Debug OTP: {debugOtp}</div> : null}
        <form
          className="stack"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              setLoading(true);
              setError(null);
              const response = await verifyOtp({ phone, otp, name });
              saveSession(response);
              router.replace("/");
            } catch (verifyError) {
              setError(verifyError instanceof Error ? verifyError.message : "Verification failed.");
            } finally {
              setLoading(false);
            }
          }}
        >
          <label className="label">
            Your name
            <input className="input" onChange={(event) => setName(event.target.value)} value={name} />
          </label>
          <label className="label">
            OTP
            <input
              className="input"
              inputMode="numeric"
              onChange={(event) => setOtp(event.target.value)}
              value={otp}
            />
          </label>
          {error ? <div className="badge">{error}</div> : null}
          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Verifying..." : "Verify and enter Saarthi"}
          </button>
        </form>
      </section>
    </main>
  );
}
