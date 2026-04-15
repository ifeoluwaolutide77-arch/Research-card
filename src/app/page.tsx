import { Suspense } from "react";
import { SearchFilter } from "@/components/SearchFilter";
import { DiscoveryRails } from "@/components/DiscoveryRails";
import { ResearchCard } from "@/components/ResearchCard";
import { EmailCapture } from "@/components/EmailCapture";
import { tryGetPool } from "@/lib/db/pool";
import { listPapersWithSummaries, listPaperRecords } from "@/lib/db/hydration";
import { getPaperById, searchPapers } from "@/lib/db/papers.repository";
import { buildDiscoveryLists } from "@/services/ranking/discovery";
import type { PaperSource, PaperWithSummary } from "@/lib/types/models";

export const dynamic = "force-dynamic";

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
    return (
      <div className="space-y-6">
        <Hero />
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-950">
          <p className="font-semibold">Database not configured</p>
          <p className="mt-2">
            Set <code className="rounded bg-white px-1">DATABASE_URL</code> to your Supabase Postgres connection string,
            apply <code className="rounded bg-white px-1">database/schema.sql</code>, optionally load{" "}
            <code className="rounded bg-white px-1">database/seed.sql</code>, then run{" "}
            <code className="rounded bg-white px-1">npm run ingest</code> and{" "}
            <code className="rounded bg-white px-1">npm run summarize</code>.
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

  return (
    <div className="space-y-10">
      <Hero />
      <Suspense
        fallback={<div className="h-24 animate-pulse rounded-2xl bg-slate-200" aria-label="Loading filters" />}
      >
        <SearchFilter />
      </Suspense>
      <DiscoveryRails
        top10Today={discovery.top10Today}
        trending={discovery.trending}
        breakthrough={discovery.breakthrough}
      />
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Latest research cards</h2>
          <p className="text-sm text-slate-600">
            Biomedical-heavy ranking by default. Expand any card via its title for the full view.
          </p>
        </div>
        <div className="grid gap-4">
          {papers.length === 0 && <p className="text-sm text-slate-500">No papers yet — run ingestion.</p>}
          {papers.map((p) => (
            <ResearchCard key={p.id} paper={p} compact />
          ))}
        </div>
      </section>
      <EmailCapture />
    </div>
  );
}

function Hero() {
  return (
    <section className="rounded-3xl bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-700 p-8 text-white shadow-lg">
      <p className="text-sm uppercase tracking-widest text-violet-100">Research intelligence</p>
      <h1 className="mt-2 text-3xl font-bold md:text-4xl">Scan new science in under a minute — without losing trust.</h1>
      <p className="mt-4 max-w-3xl text-sm text-violet-50 md:text-base">
        ResearchCard aggregates open-access feeds, deduplicates them, and renders transparent AI cards that never pretend
        to be peer review. Every numeric claim should be checked against the linked original article.
      </p>
    </section>
  );
}
