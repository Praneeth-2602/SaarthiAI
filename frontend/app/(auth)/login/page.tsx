"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestOtp } from "@/lib/api";
import { setPendingOtp, setPendingPhone } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="eyebrow">Secure nominee access</div>
        <h1>Start with a phone number.</h1>
        <p className="lead small-copy">
          We only ask for enough to open the workspace. In development, the OTP is shown
          on screen so the flow still works without SMS setup.
        </p>
        <form
          className="stack-form"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              setLoading(true);
              setError(null);
              const response = await requestOtp(phone);
              setPendingPhone(phone);
              setPendingOtp(response.debugOtp ?? "");
              setDebugOtp(response.debugOtp ?? null);
              router.push(`/verify?phone=${encodeURIComponent(phone)}`);
            } catch (requestError) {
              setError(requestError instanceof Error ? requestError.message : "Unable to request OTP.");
            } finally {
              setLoading(false);
            }
          }}
        >
          <label className="label">
            Phone number
            <input
              className="field"
              inputMode="numeric"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Enter nominee phone number"
              value={phone}
            />
          </label>
          {debugOtp ? <div className="inline-note">Debug OTP: {debugOtp}</div> : null}
          {error ? <div className="inline-error">{error}</div> : null}
          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Sending..." : "Request OTP"}
          </button>
        </form>
      </section>
    </main>
  );
}
