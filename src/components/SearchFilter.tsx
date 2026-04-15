"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { motion } from "framer-motion";

export function SearchFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      startTransition(() => {
        router.push(`/?${next.toString()}`);
      });
    },
    [params, router],
  );

  const applyPreset = useCallback(
    (preset: { q?: string; source?: string }) => {
      const next = new URLSearchParams(params.toString());
      if (preset.q) next.set("q", preset.q);
      else next.delete("q");
      if (preset.source) next.set("source", preset.source);
      else next.delete("source");
      startTransition(() => {
        router.push(`/?${next.toString()}`);
      });
    },
    [params, router],
  );

  const shareablePresets: Array<{ label: string; q?: string; source?: string }> = [
    { label: "Oncology trials", q: "oncology trial phase", source: "pubmed" },
    { label: "Immunotherapy signal", q: "immunotherapy biomarker response", source: "pubmed" },
    { label: "Radiology AI", q: "radiology ai diagnostics", source: "arxiv" },
    { label: "Vaccine safety watch", q: "vaccine adverse event surveillance", source: "pubmed" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="lab-panel space-y-4 p-4 md:p-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="lab-heading text-lg">Research Explorer</h2>
          <p className="lab-subtle text-xs">Use source and query filters to tune the discovery stream.</p>
        </div>
        <span className="rounded-full border border-cyan-200/25 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100/85">
          Interactive module
        </span>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-cyan-50">Search</span>
          <input
            defaultValue={params.get("q") ?? ""}
            name="q"
            placeholder="Title, abstract, indication, modality, biomarker..."
            className="rounded-lg border border-cyan-100/20 bg-slate-950/50 px-3 py-2 text-sm text-cyan-50 outline-none ring-cyan-300/60 focus:ring-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setParam("q", (e.target as HTMLInputElement).value.trim() || null);
              }
            }}
          />
        </label>
        <label className="flex w-full flex-col gap-1 text-sm md:w-52">
          <span className="font-medium text-cyan-50">Source</span>
          <select
            defaultValue={params.get("source") ?? ""}
            className="rounded-lg border border-cyan-100/20 bg-slate-950/50 px-3 py-2 text-sm text-cyan-50 outline-none ring-cyan-300/60 focus:ring-2"
            onChange={(e) => setParam("source", e.target.value || null)}
          >
            <option value="">All</option>
            <option value="pubmed">PubMed</option>
            <option value="arxiv">arXiv</option>
            <option value="biorxiv">bioRxiv</option>
          </select>
        </label>
        <motion.button
          type="button"
          disabled={pending}
          whileTap={{ scale: 0.98 }}
          whileHover={{ y: -1 }}
          onClick={() => {
            const el = document.querySelector<HTMLInputElement>('input[name="q"]');
            setParam("q", el?.value.trim() || null);
          }}
          className="h-10 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:opacity-60"
        >
          {pending ? "Applying..." : "Apply"}
        </motion.button>
      </div>

      <div className="flex flex-wrap gap-2">
        {["oncology biomarkers", "gene therapy", "radiology AI", "vaccine safety", "clinical trial protocol"].map(
          (preset) => (
            <motion.button
              key={preset}
              type="button"
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -1 }}
              onClick={() => setParam("q", preset)}
              className="rounded-full border border-cyan-200/20 bg-slate-950/45 px-3 py-1 text-xs font-medium text-cyan-100/90 transition-colors hover:bg-cyan-500/20"
            >
              {preset}
            </motion.button>
          ),
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-cyan-100/65">Preset views (shareable URLs)</p>
        <div className="flex flex-wrap gap-2">
          {shareablePresets.map((preset) => (
            <motion.button
              key={preset.label}
              type="button"
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -1 }}
              onClick={() => applyPreset(preset)}
              className="rounded-full border border-emerald-200/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100 transition-colors hover:bg-emerald-500/20"
            >
              {preset.label}
            </motion.button>
          ))}
        </div>
        <p className="text-xs text-cyan-100/60">
          These presets update query params directly, so you can copy and share the URL for the exact same view.
        </p>
      </div>
    </motion.div>
  );
}
