"use client";

import type { PaperWithSummary } from "@/lib/types/models";
import { motion } from "framer-motion";
import { ResearchCard } from "@/components/ResearchCard";

export function DiscoveryRails(props: {
  top10Today: PaperWithSummary[];
  trending: PaperWithSummary[];
  breakthrough: PaperWithSummary | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="grid gap-6 lg:grid-cols-3"
    >
      <Rail
        title="Top 10 Papers Today"
        subtitle="Ranked by biomedical relevance, recency, quantitative signals, and user feedback."
        papers={props.top10Today}
      />
      <Rail
        title="Trending Papers"
        subtitle="Highest composite score across the live index, not social hype alone."
        papers={props.trending.slice(0, 10)}
      />
      <motion.section
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="lab-panel p-4 md:p-5"
      >
        <header>
          <div className="mb-2 inline-flex rounded-full border border-emerald-200/25 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-100">
            Highlight module
          </div>
          <h2 className="lab-heading text-xl">Breakthrough of the Day</h2>
          <p className="lab-subtle text-sm">
            Highest composite item with strong quantitative + keyword signals. Still not “truth” — read the source.
          </p>
        </header>
        <div className="mt-3">
          {props.breakthrough ? (
            <ResearchCard paper={props.breakthrough} compact />
          ) : (
            <p className="text-sm text-cyan-100/70">No candidate yet — ingest more papers.</p>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}

function Rail(props: { title: string; subtitle: string; papers: PaperWithSummary[] }) {
  return (
    <motion.section whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="lab-panel flex flex-col gap-3 p-4 md:p-5">
      <header>
        <h2 className="lab-heading text-xl">{props.title}</h2>
        <p className="lab-subtle text-sm">{props.subtitle}</p>
      </header>
      <div className="flex flex-col gap-3">
        {props.papers.length === 0 && <p className="text-sm text-cyan-100/70">Nothing to show yet.</p>}
        {props.papers.map((p) => (
          <ResearchCard key={p.id} paper={p} compact />
        ))}
      </div>
    </motion.section>
  );
}
