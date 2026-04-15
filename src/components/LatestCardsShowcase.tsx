"use client";

import { motion } from "framer-motion";
import type { PaperWithSummary } from "@/lib/types/models";
import { ResearchCard } from "@/components/ResearchCard";

export function LatestCardsShowcase(props: { papers: PaperWithSummary[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="lab-heading text-2xl md:text-3xl">Latest research cards</h2>
          <p className="lab-subtle text-sm">
            Prioritized for biomedical relevance, recency, quantitative signals, and feedback.
          </p>
        </div>
        <span className="rounded-full border border-cyan-200/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
          Live monitoring mode
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {["Signal-aligned ranking", "Transparent confidence context", "Fast source-to-summary navigation"].map(
          (item, idx) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.28, ease: "easeOut", delay: idx * 0.05 }}
              className="lab-panel p-3 text-xs font-medium text-cyan-100/80"
            >
              {item}
            </motion.div>
          ),
        )}
      </div>

      <div className="grid gap-4">
        {props.papers.length === 0 && <p className="text-sm text-cyan-100/70">No papers yet — run ingestion.</p>}
        {props.papers.map((paper, idx) => (
          <motion.div
            key={paper.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.24, ease: "easeOut", delay: Math.min(idx, 6) * 0.03 }}
          >
            <ResearchCard paper={paper} compact />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
