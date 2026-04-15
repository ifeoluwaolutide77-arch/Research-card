"use client";

import { useState } from "react";

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, weeklyDigest: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setStatus(data.error ?? "Could not subscribe.");
      else setStatus("You are on the list for the weekly digest trigger (no login required).");
      setEmail("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-violet-200 bg-violet-50 p-6">
      <h2 className="text-lg font-semibold text-violet-950">Weekly digest</h2>
      <p className="mt-1 text-sm text-violet-900/80">
        Drop your email for a curated weekly mailshot of top cards. No accounts — double opt-in can be wired to Resend
        in production.
      </p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@lab.org"
          className="flex-1 rounded-lg border border-violet-200 px-3 py-2 text-sm outline-none ring-violet-500 focus:ring-2"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Notify me"}
        </button>
      </form>
      {status && <p className="mt-2 text-sm text-violet-900">{status}</p>}
    </section>
  );
}
