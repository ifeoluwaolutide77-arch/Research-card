"use client";

import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";

export function StickyResearchRadar(props: {
  indexed: number;
  visible: number;
  query?: string;
  source?: string;
}) {
  const { scrollYProgress } = useScroll();
  const [progress, setProgress] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setProgress(Math.round(v * 100));
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="sticky top-[72px] z-10 overflow-hidden rounded-2xl border border-cyan-100/20 bg-slate-950/85 p-3 backdrop-blur-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-cyan-200/25 bg-cyan-500/15 px-2.5 py-1 font-medium text-cyan-100">
            Research radar
          </span>
          <span className="text-cyan-100/70">
            Visible <strong className="text-cyan-100">{props.visible}</strong> / Indexed{" "}
            <strong className="text-cyan-100">{props.indexed}</strong>
          </span>
          {props.query && (
            <span className="rounded-full border border-cyan-100/20 bg-slate-900/60 px-2.5 py-1 text-cyan-100/80">
              Query: {props.query}
            </span>
          )}
          {props.source && (
            <span className="rounded-full border border-emerald-100/20 bg-emerald-500/15 px-2.5 py-1 uppercase tracking-wide text-emerald-100/90">
              Source: {props.source}
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-cyan-100/75">Scroll depth {progress}%</span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cyan-100/10">
        <motion.div className="h-full origin-left bg-cyan-300/85" style={{ scaleX: scrollYProgress }} />
      </div>
    </motion.section>
  );
}
