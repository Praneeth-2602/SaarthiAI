"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { verifyOtp } from "@/lib/api";
import { getPendingOtp, getPendingPhone, saveSession } from "@/lib/store";

export default function VerifyPage() {
  const router = useRouter();
  const debugOtp = getPendingOtp();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPhone(params.get("phone") ?? getPendingPhone() ?? "");
  }, []);

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="eyebrow">Verify access</div>
        <h1>Complete sign-in</h1>
        <p className="lead small-copy">Use the OTP sent for {phone || "your phone number"}.</p>
        {debugOtp ? <div className="inline-note">Debug OTP: {debugOtp}</div> : null}
        <form
          className="stack-form"
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
            <input className="field" onChange={(event) => setName(event.target.value)} value={name} />
          </label>
          <label className="label">
            OTP
            <input
              className="field"
              inputMode="numeric"
              onChange={(event) => setOtp(event.target.value)}
              value={otp}
            />
          </label>
          {error ? <div className="inline-error">{error}</div> : null}
          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Verifying..." : "Verify and enter Saarthi"}
          </button>
        </form>
      </section>
    </main>
  );
}
