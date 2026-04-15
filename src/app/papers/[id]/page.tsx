import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpandedCard } from "@/components/ExpandedCard";
import { tryGetPool } from "@/lib/db/pool";
import { getPaperById } from "@/lib/db/papers.repository";
import { attachRankingSignals } from "@/services/ranking/signals";

export const dynamic = "force-dynamic";

export default async function PaperPage({ params }: { params: { id: string } }) {
  const pool = tryGetPool();
  if (!pool) notFound();
  const paper = await getPaperById(pool, params.id);
  if (!paper) notFound();
  const ranked = attachRankingSignals([paper])[0];

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm font-medium text-cyan-300 hover:text-cyan-200 hover:underline">
        ← Back to discovery
      </Link>
      <ExpandedCard paper={ranked} />
      {ranked.ranking && (
        <section className="lab-panel p-4 text-sm text-cyan-100/85">
          <h2 className="text-base font-semibold text-cyan-50">Ranking signals (transparent)</h2>
          <ul className="mt-2 grid gap-2 md:grid-cols-2">
            <li>Recency: {ranked.ranking.recency.toFixed(1)}</li>
            <li>Quantitative density: {ranked.ranking.quantitative.toFixed(1)}</li>
            <li>Keyword / domain match: {ranked.ranking.keyword.toFixed(1)}</li>
            <li>Engagement: {ranked.ranking.engagement.toFixed(1)}</li>
            <li className="md:col-span-2 font-semibold">Composite: {ranked.ranking.composite.toFixed(1)}</li>
          </ul>
        </section>
      )}
    </div>
  );
}
