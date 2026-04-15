"use client";

import Link from "next/link";
import { useState } from "react";
import type { PaperWithSummary } from "@/lib/types/models";
import { TrustBadge } from "@/components/TrustBadge";

export function ResearchCard(props: { paper: PaperWithSummary; compact?: boolean }) {
  const { paper } = props;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function vote(v: 1 | -1) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId: paper.id, vote: v }),
      });
      if (res.status === 429) setMsg("Thanks — you are sending feedback quickly. Try again shortly.");
      else if (!res.ok) setMsg("Could not record feedback.");
      else setMsg("Feedback recorded anonymously.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {paper.source} · {paper.journal ?? "Preprint / journal N/A"}
          </div>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            <Link href={`/papers/${paper.id}`} className="hover:underline">
              {paper.title}
            </Link>
          </h3>
        </div>
        <a
          href={paper.url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
        >
          Original source
        </a>
      </div>

      {paper.summary?.one_liner && (
        <p className="text-sm text-slate-700">
          <span className="font-semibold text-violet-700">AI one-liner: </span>
          {paper.summary.one_liner}
        </p>
      )}

      {!props.compact && paper.summary && (
        <dl className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <Field label="Problem" value={paper.summary.problem} />
          <Field label="Objective" value={paper.summary.objective} />
          <Field label="Methods" value={paper.summary.methods} />
          <Field label="Results (as stated in abstract)" value={paper.summary.results} />
          <Field label="Limitations" value={paper.summary.limitations} />
          <Field label="Possible improvements" value={paper.summary.improvements} />
        </dl>
      )}

      {paper.summary?.tags && paper.summary.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {paper.summary.tags.map((t) => (
            <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              {t}
            </span>
          ))}
        </div>
      )}

      <TrustBadge confidence={paper.summary?.confidence} sourceLabel={paper.summary?.source_label} />

      {paper.summary?.ai_disclaimer && (
        <p className="text-xs text-slate-500">{paper.summary.ai_disclaimer}</p>
      )}

      {paper.summary?.uncertain && paper.summary.uncertainty_notes && (
        <p className="text-xs font-medium text-amber-800">Uncertainty: {paper.summary.uncertainty_notes}</p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-sm">
        <span className="text-slate-500">Was this card helpful?</span>
        <button
          type="button"
          disabled={busy}
          onClick={() => vote(1)}
          className="rounded-lg border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
        >
          👍
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => vote(-1)}
          className="rounded-lg border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
        >
          👎
        </button>
        <span className="text-xs text-slate-400">
          {paper.engagement.thumbs_up}↑ {paper.engagement.thumbs_down}↓
        </span>
        {msg && <span className="text-xs text-slate-600">{msg}</span>}
      </div>

      {paper.authors.length > 0 && (
        <div className="text-xs text-slate-500">
          Authors:{" "}
          {paper.authors.map((a, i) => (
            <span key={a.id}>
              {i > 0 ? ", " : ""}
              <Link href={`/authors/${a.id}`} className="text-violet-700 hover:underline">
                {a.name}
              </Link>
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

function Field(props: { label: string; value: string | null | undefined }) {
  if (!props.value) return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-slate-500">{props.label}</dt>
      <dd className="mt-0.5">{props.value}</dd>
    </div>
  );
}
