"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

export type PipelinePhase = {
  id: string;
  label: string;
  count: number;
  focus: string;
  note: string;
};

export function PipelineSnapshot(props: { phases: PipelinePhase[] }) {
  const [activeId, setActiveId] = useState(() => {
    const top = [...props.phases].sort((a, b) => b.count - a.count)[0];
    return top?.id ?? props.phases[0]?.id ?? "";
  });

  const active = props.phases.find((phase) => phase.id === activeId) ?? props.phases[0];
  const max = Math.max(1, ...props.phases.map((p) => p.count));
  const total = props.phases.reduce((acc, phase) => acc + phase.count, 0);

  const distribution = useMemo(
    () =>
      props.phases.map((phase) => ({
        ...phase,
        width: `${Math.max(8, (phase.count / max) * 100)}%`,
        share: total ? Math.round((phase.count / total) * 100) : 0,
      })),
    [props.phases, max, total],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="lab-panel space-y-4 p-4 md:p-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="lab-heading text-xl">Trial pipeline snapshot</h2>
          <p className="lab-subtle text-sm">Interactive stage monitor across preclinical and clinical signals.</p>
        </div>
        <span className="rounded-full border border-cyan-200/25 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-100/90">
          Animated module
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {distribution.map((phase) => {
          const selected = active?.id === phase.id;
          return (
            <motion.button
              key={phase.id}
              type="button"
              onClick={() => setActiveId(phase.id)}
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -2 }}
              className={`rounded-xl border p-3 text-left transition-colors ${
                selected
                  ? "border-cyan-200/45 bg-cyan-500/20"
                  : "border-cyan-100/15 bg-slate-950/45 hover:bg-cyan-500/10"
              }`}
            >
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-100/65">{phase.label}</p>
              <p className="mt-1 text-2xl font-semibold text-cyan-50">{phase.count}</p>
              <p className="text-xs text-cyan-100/70">{phase.share}% of pipeline</p>
            </motion.button>
          );
        })}
      </div>

      {active && (
        <motion.article
          key={active.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="rounded-xl border border-cyan-100/20 bg-slate-950/50 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-cyan-50">{active.label} focus</h3>
            <span className="rounded-full border border-cyan-100/20 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-100/80">
              {active.count} detected
            </span>
          </div>
          <p className="mt-2 text-sm text-cyan-100/80">{active.focus}</p>
          <p className="mt-1 text-xs text-cyan-100/65">{active.note}</p>
          <div className="mt-3 h-2 rounded-full bg-cyan-100/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(10, (active.count / max) * 100)}%` }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="h-2 rounded-full bg-cyan-300/80"
            />
          </div>
        </motion.article>
      )}
    </motion.section>
  );
}
