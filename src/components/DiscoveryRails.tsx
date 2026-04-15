import type { PaperWithSummary } from "@/lib/types/models";
import { ResearchCard } from "@/components/ResearchCard";

export function DiscoveryRails(props: {
  top10Today: PaperWithSummary[];
  trending: PaperWithSummary[];
  breakthrough: PaperWithSummary | null;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <Rail title="Top 10 Papers Today" subtitle="Ranked by biomedical relevance, recency, quant signals, and feedback." papers={props.top10Today} />
      <Rail title="Trending Papers" subtitle="Highest composite score across the live index (not social hype alone)." papers={props.trending.slice(0, 10)} />
      <section className="flex flex-col gap-3">
        <header>
          <h2 className="text-xl font-semibold text-slate-900">Breakthrough of the Day</h2>
          <p className="text-sm text-slate-600">
            Highest composite item with strong quantitative + keyword signals. Still not “truth” — read the source.
          </p>
        </header>
        {props.breakthrough ? (
          <ResearchCard paper={props.breakthrough} compact />
        ) : (
          <p className="text-sm text-slate-500">No candidate yet — ingest more papers.</p>
        )}
      </section>
    </div>
  );
}

function Rail(props: { title: string; subtitle: string; papers: PaperWithSummary[] }) {
  return (
    <section className="flex flex-col gap-3">
      <header>
        <h2 className="text-xl font-semibold text-slate-900">{props.title}</h2>
        <p className="text-sm text-slate-600">{props.subtitle}</p>
      </header>
      <div className="flex flex-col gap-3">
        {props.papers.length === 0 && <p className="text-sm text-slate-500">Nothing to show yet.</p>}
        {props.papers.map((p) => (
          <ResearchCard key={p.id} paper={p} compact />
        ))}
      </div>
    </section>
  );
}
