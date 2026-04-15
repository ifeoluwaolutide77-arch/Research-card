"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
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
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="lab-panel group flex flex-col gap-3 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-cyan-100/70">
            {paper.source} · {paper.journal ?? "Preprint / journal N/A"}
          </div>
          <h3 className="mt-1 text-lg font-semibold text-cyan-50">
            <Link href={`/papers/${paper.id}`} className="hover:text-cyan-200 hover:underline">
              {paper.title}
            </Link>
          </h3>
        </div>
        <motion.a
          href={paper.url}
          target="_blank"
          rel="noreferrer"
          whileTap={{ scale: 0.98 }}
          whileHover={{ y: -1 }}
          className="shrink-0 rounded-full border border-cyan-200/25 bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-50 transition-colors hover:bg-cyan-500/35"
        >
          Original source
        </motion.a>
      </div>

      {paper.summary?.one_liner && (
        <p className="rounded-lg border border-cyan-100/15 bg-cyan-500/10 p-2.5 text-sm text-cyan-50/90">
          <span className="font-semibold text-cyan-200">AI one-liner: </span>
          {paper.summary.one_liner}
        </p>
      )}

      {!props.compact && paper.summary && (
        <dl className="grid gap-2 text-sm text-cyan-100/85 md:grid-cols-2">
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
            <span
              key={t}
              className="rounded-full border border-cyan-200/20 bg-slate-950/45 px-2.5 py-0.5 text-xs text-cyan-100/90"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <TrustBadge confidence={paper.summary?.confidence} sourceLabel={paper.summary?.source_label} />

      {paper.summary?.ai_disclaimer && (
        <p className="text-xs text-cyan-100/65">{paper.summary.ai_disclaimer}</p>
      )}

      {paper.summary?.uncertain && paper.summary.uncertainty_notes && (
        <p className="rounded-lg border border-amber-200/25 bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-100">
          Uncertainty: {paper.summary.uncertainty_notes}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-cyan-100/10 pt-3 text-sm">
        <span className="text-cyan-100/70">Was this card helpful?</span>
        <motion.button
          type="button"
          disabled={busy}
          whileTap={{ scale: 0.97 }}
          whileHover={{ y: -1 }}
          onClick={() => vote(1)}
          className="rounded-lg border border-cyan-200/20 bg-cyan-500/10 px-3 py-1 transition-colors hover:bg-cyan-500/20 disabled:opacity-50"
        >
          👍
        </motion.button>
        <motion.button
          type="button"
          disabled={busy}
          whileTap={{ scale: 0.97 }}
          whileHover={{ y: -1 }}
          onClick={() => vote(-1)}
          className="rounded-lg border border-cyan-200/20 bg-cyan-500/10 px-3 py-1 transition-colors hover:bg-cyan-500/20 disabled:opacity-50"
        >
          👎
        </motion.button>
        <span className="text-xs text-cyan-100/60">
          {paper.engagement.thumbs_up}↑ {paper.engagement.thumbs_down}↓
        </span>
        {msg && <span className="text-xs text-cyan-100/80">{msg}</span>}
      </div>

      {paper.authors.length > 0 && (
        <div className="text-xs text-cyan-100/70">
          Authors:{" "}
          {paper.authors.map((a, i) => (
            <span key={a.id}>
              {i > 0 ? ", " : ""}
              <Link href={`/authors/${a.id}`} className="text-cyan-300 hover:text-cyan-200 hover:underline">
                {a.name}
              </Link>
            </span>
          ))}
        </div>
      )}
    </motion.article>
  );
}

function Field(props: { label: string; value: string | null | undefined }) {
  if (!props.value) return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-cyan-100/60">{props.label}</dt>
      <dd className="mt-0.5 text-cyan-50/90">{props.value}</dd>
    </div>
  );
}
