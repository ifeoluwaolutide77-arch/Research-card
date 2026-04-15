import { Suspense } from "react";
import { SearchFilter } from "@/components/SearchFilter";
import { DiscoveryRails } from "@/components/DiscoveryRails";
import { EmailCapture } from "@/components/EmailCapture";
import { BiotechParticleField } from "@/components/BiotechParticleField";
import { HeroInteractiveModules } from "@/components/HeroInteractiveModules";
import { PipelineSnapshot, type PipelinePhase } from "@/components/PipelineSnapshot";
import { LatestCardsShowcase } from "@/components/LatestCardsShowcase";
import { StickyResearchRadar } from "@/components/StickyResearchRadar";
import { tryGetPool } from "@/lib/db/pool";
import { listPapersWithSummaries, listPaperRecords } from "@/lib/db/hydration";
import { getPaperById, searchPapers } from "@/lib/db/papers.repository";
import { buildDiscoveryLists } from "@/services/ranking/discovery";
import type { PaperSource, PaperWithSummary, SummaryConfidence } from "@/lib/types/models";

export const dynamic = "force-dynamic";

const phaseHeuristics = [
  {
    id: "preclinical",
    label: "Preclinical",
    match: /\bpreclinical\b|\bin vitro\b|\bin vivo\b|\banimal\b|\bmurine\b|\bmouse\b/i,
    fallbackFocus: "Mechanism validation and translational relevance checks",
    note: "Early evidence, model quality, and biomarker rationale dominate this stage.",
  },
  {
    id: "phase-i",
    label: "Phase I",
    match: /\bphase\s*(?:1|i)\b/i,
    fallbackFocus: "Dose escalation, safety, and tolerability endpoints",
    note: "Safety profile maturation and dosage boundaries are primary concerns.",
  },
  {
    id: "phase-ii",
    label: "Phase II",
    match: /\bphase\s*(?:2|ii)\b/i,
    fallbackFocus: "Signal-of-efficacy and cohort stratification",
    note: "Design quality and subgroup signal integrity become critical.",
  },
  {
    id: "phase-iii",
    label: "Phase III",
    match: /\bphase\s*(?:3|iii)\b/i,
    fallbackFocus: "Confirmatory outcomes and real-world readiness",
    note: "Confirmatory robustness and reproducibility shape go/no-go confidence.",
  },
] as const;

function isPaperSource(s: string | undefined): s is PaperSource {
  return s === "pubmed" || s === "arxiv" || s === "biorxiv";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === "string" ? resolvedParams.q : undefined;
  const sourceRaw = typeof resolvedParams.source === "string" ? resolvedParams.source : undefined;
  const source = isPaperSource(sourceRaw) ? sourceRaw : undefined;

  const pool = tryGetPool();
  if (!pool) {
    const emptySource = [
      { label: "pubmed", value: 0 },
      { label: "arxiv", value: 0 },
      { label: "biorxiv", value: 0 },
    ] satisfies { label: string; value: number }[];
    const emptyConfidence = [
      { label: "high", value: 0 },
      { label: "medium", value: 0 },
      { label: "low", value: 0 },
    ] satisfies { label: string; value: number }[];

    return (
      <div className="space-y-8">
        <Hero stats={{ indexed: 0, withAiSummary: 0, sources: 3 }} sourceBreakdown={emptySource} confidenceBreakdown={emptyConfidence} />
        <div className="lab-panel border-amber-200/30 bg-amber-500/10 p-6 text-sm text-amber-100">
          <p className="font-semibold text-amber-50">Database not configured</p>
          <p className="mt-2">
            Set <code className="rounded bg-amber-50/30 px-1 py-0.5">DATABASE_URL</code> to your Supabase Postgres
            connection string, apply <code className="rounded bg-amber-50/30 px-1 py-0.5">database/schema.sql</code>,
            optionally load <code className="rounded bg-amber-50/30 px-1 py-0.5">database/seed.sql</code>, then run{" "}
            <code className="rounded bg-amber-50/30 px-1 py-0.5">npm run ingest</code> and{" "}
            <code className="rounded bg-amber-50/30 px-1 py-0.5">npm run summarize</code>.
          </p>
        </div>
        <EmailCapture />
      </div>
    );
  }

  let papers: PaperWithSummary[];
  const records = await listPaperRecords(pool, 400);

  if (q || source) {
    const rows = await searchPapers(pool, { q, source, limit: 40, offset: 0 });
    const detailed: PaperWithSummary[] = [];
    for (const p of rows) {
      const full = await getPaperById(pool, p.id);
      if (full) detailed.push(full);
    }
    papers = detailed;
  } else {
    papers = await listPapersWithSummaries(pool, 120);
  }

  const discovery = buildDiscoveryLists(papers, records);
  const sourceCount = new Set(records.map((r) => r.source)).size;
  const sourceBreakdown = (["pubmed", "arxiv", "biorxiv"] as const).map((sourceName) => ({
    label: sourceName,
    value: records.filter((r) => r.source === sourceName).length,
  }));
  const confidenceCounts: Record<SummaryConfidence, number> = { high: 0, medium: 0, low: 0 };
  for (const paper of papers) {
    if (paper.summary?.confidence) confidenceCounts[paper.summary.confidence] += 1;
  }
  const confidenceBreakdown = (["high", "medium", "low"] as const).map((c) => ({
    label: c,
    value: confidenceCounts[c],
  }));
  const pipelinePhases = buildPipelineSnapshot(papers);

  return (
    <div className="space-y-10">
      <Hero
        stats={{ indexed: records.length, withAiSummary: papers.length, sources: sourceCount }}
        sourceBreakdown={sourceBreakdown}
        confidenceBreakdown={confidenceBreakdown}
      />
      <StickyResearchRadar indexed={records.length} visible={papers.length} query={q} source={source} />
      <Suspense
        fallback={<div className="lab-panel h-24 animate-pulse" aria-label="Loading filters" />}
      >
        <SearchFilter />
      </Suspense>
      <PipelineSnapshot phases={pipelinePhases} />
      <DiscoveryRails
        top10Today={discovery.top10Today}
        trending={discovery.trending}
        breakthrough={discovery.breakthrough}
      />
      <LatestCardsShowcase papers={papers} />
      <EmailCapture />
    </div>
  );
}

function Hero(props: {
  stats: { indexed: number; withAiSummary: number; sources: number };
  sourceBreakdown: { label: string; value: number }[];
  confidenceBreakdown: { label: string; value: number }[];
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-cyan-100/20 bg-slate-950/65 p-6 shadow-2xl shadow-cyan-500/5 md:p-8">
      <BiotechParticleField />
      <div className="scanline" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(52,211,153,0.14),transparent_42%)]" />
      <div className="relative z-10 space-y-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-cyan-200/25 bg-cyan-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">
            Pharma and biotech research intelligence
          </span>
          <span className="rounded-full border border-emerald-200/20 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-100">
            Real-time feed synthesis
          </span>
        </div>

        <div className="max-w-4xl space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-cyan-50 md:text-5xl">
            Navigate biomedical signals with an interactive discovery cockpit.
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-cyan-100/85 md:text-base">
            ResearchCard aggregates open-access sources, deduplicates new records, and produces transparent AI cards for
            fast triage. Each signal remains source-grounded with confidence and uncertainty surfaced inline.
          </p>
        </div>

        <HeroInteractiveModules
          stats={props.stats}
          sourceBreakdown={props.sourceBreakdown}
          confidenceBreakdown={props.confidenceBreakdown}
        />

        <div className="grid gap-3 lg:grid-cols-3">
          {[
            {
              title: "Interactive triage modules",
              desc: "Use source filters and ranking rails to surface likely high-value candidates quickly.",
            },
            {
              title: "Confidence-aware insights",
              desc: "Each generated summary includes confidence and uncertainty notes before decision-making.",
            },
            {
              title: "Source-linked verification",
              desc: "Open each original paper directly to validate quantitative claims in context.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="lab-panel-strong group p-4 transition-transform duration-300 hover:-translate-y-1 hover:border-cyan-200/40"
            >
              <h2 className="text-sm font-semibold text-cyan-50">{item.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-cyan-100/70">{item.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function buildPipelineSnapshot(papers: PaperWithSummary[]): PipelinePhase[] {
  return phaseHeuristics.map((phase) => {
    const matched = papers.filter((paper) => {
      const text = [paper.title, paper.abstract ?? "", paper.summary?.tags?.join(" ") ?? ""].join(" ");
      return phase.match.test(text);
    });
    const focus = mostCommonTag(matched) ?? phase.fallbackFocus;
    return {
      id: phase.id,
      label: phase.label,
      count: matched.length,
      focus,
      note: phase.note,
    };
  });
}

function mostCommonTag(papers: PaperWithSummary[]): string | null {
  const counts = new Map<string, number>();
  for (const paper of papers) {
    for (const tag of paper.summary?.tags ?? []) {
      const normalized = tag.trim().toLowerCase();
      if (!normalized) continue;
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [tag, count] of counts.entries()) {
    if (count > bestCount) {
      best = tag;
      bestCount = count;
    }
  }
  return best;
}
