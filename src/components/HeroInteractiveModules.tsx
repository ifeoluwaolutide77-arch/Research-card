"use client";

import { motion, useReducedMotion } from "framer-motion";

type Item = { label: string; value: number };

export function HeroInteractiveModules(props: {
  stats: { indexed: number; withAiSummary: number; sources: number };
  sourceBreakdown: Item[];
  confidenceBreakdown: Item[];
}) {
  const prefersReducedMotion = useReducedMotion();
  const sourceMax = Math.max(1, ...props.sourceBreakdown.map((i) => i.value));
  const confidenceMax = Math.max(1, ...props.confidenceBreakdown.map((i) => i.value));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Indexed records" value={props.stats.indexed.toLocaleString()} delay={0.05} />
        <Metric label="AI-ready cards" value={props.stats.withAiSummary.toLocaleString()} delay={0.12} />
        <Metric label="Connected sources" value={String(props.stats.sources)} delay={0.19} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <motion.article
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="lab-panel-strong p-4"
        >
          <h2 className="text-sm font-semibold text-cyan-50">Source feed activity</h2>
          <p className="mt-1 text-xs text-cyan-100/65">Live distribution of ingested research by provider.</p>
          <div className="mt-3 space-y-2">
            {props.sourceBreakdown.map((item) => {
              const width = `${Math.max(10, (item.value / sourceMax) * 100)}%`;
              return (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-xs text-cyan-100/70">
                    <span className="uppercase tracking-wide">{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-cyan-100/10">
                    <motion.div
                      initial={{ width: prefersReducedMotion ? width : 0 }}
                      whileInView={{ width }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.65, ease: "easeOut" }}
                      className="h-2 rounded-full bg-cyan-300/80"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
          className="lab-panel-strong p-4"
        >
          <h2 className="text-sm font-semibold text-cyan-50">Summary confidence distribution</h2>
          <p className="mt-1 text-xs text-cyan-100/65">Quick view of confidence quality for current visible cards.</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {props.confidenceBreakdown.map((item) => {
              const height = `${Math.max(14, (item.value / confidenceMax) * 100)}%`;
              return (
                <div key={item.label} className="flex flex-col items-center gap-2">
                  <div className="flex h-20 w-full items-end rounded-lg bg-cyan-100/10 p-1">
                    <motion.div
                      initial={{ height: prefersReducedMotion ? height : 0 }}
                      whileInView={{ height }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="w-full rounded bg-emerald-300/75"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] uppercase tracking-wide text-cyan-100/65">{item.label}</p>
                    <p className="text-sm font-semibold text-cyan-50">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.article>
      </div>
    </div>
  );
}

function Metric(props: { label: string; value: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: props.delay }}
      whileHover={{ y: -3 }}
      className="lab-panel-strong p-4"
    >
      <p className="text-xs uppercase tracking-[0.12em] text-cyan-100/65">{props.label}</p>
      <p className="mt-1 text-2xl font-semibold text-cyan-50">{props.value}</p>
    </motion.div>
  );
}
