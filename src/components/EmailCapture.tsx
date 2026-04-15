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
    <section className="lab-panel relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="relative z-10">
        <h2 className="lab-heading text-lg">Weekly biotech digest</h2>
        <p className="lab-subtle mt-1 text-sm">
          Get a curated weekly briefing of top cards across therapeutic areas. No account required.
        </p>
      </div>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@lab.org"
          className="flex-1 rounded-lg border border-cyan-100/20 bg-slate-950/55 px-3 py-2 text-sm text-cyan-50 outline-none ring-cyan-300/60 focus:ring-2"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:opacity-60"
        >
          {busy ? "Saving..." : "Notify me"}
        </button>
      </form>
      {status && <p className="mt-2 text-sm text-cyan-100/85">{status}</p>}
    </section>
  );
}
