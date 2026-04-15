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
    <main className="page-shell">
      <section className="hero" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="eyebrow">Secure nominee access</div>
        <h1>Log in with a phone OTP.</h1>
        <p>
          For the MVP, Saarthi sends a dev-safe code directly in the response so you can move through the full flow without SMS setup.
        </p>
        <form
          className="stack"
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
              className="input"
              inputMode="numeric"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Enter nominee phone number"
              value={phone}
            />
          </label>
          {debugOtp ? <div className="badge">Debug OTP: {debugOtp}</div> : null}
          {error ? <div className="badge">{error}</div> : null}
          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Sending..." : "Request OTP"}
          </button>
        </form>
      </section>
    </main>
  );
}
