import Link from "next/link";
import { notFound } from "next/navigation";
import { ResearchCard } from "@/components/ResearchCard";
import { tryGetPool } from "@/lib/db/pool";
import {
  getAuthorById,
  getPaperById,
  listPapersForAuthor,
  updateAuthorResearchTags,
} from "@/lib/db/papers.repository";
import { inferAuthorInterestTags } from "@/services/ai/authorInterestTags";

export const dynamic = "force-dynamic";

export default async function AuthorPage({ params }: { params: { id: string } }) {
  const pool = tryGetPool();
  if (!pool) notFound();
  const author = await getAuthorById(pool, params.id);
  if (!author) notFound();

  const paperRows = await listPapersForAuthor(pool, author.id);
  const papers = [];
  for (const pr of paperRows) {
    const full = await getPaperById(pool, pr.id);
    if (full) papers.push(full);
  }

  let tags = author.research_tags;
  if (!tags.length && papers.length) {
    const snippets = papers.map((p) => `${p.title}\n${p.abstract ?? ""}`.slice(0, 1500));
    tags = await inferAuthorInterestTags({ authorName: author.name, paperSnippets: snippets });
    await updateAuthorResearchTags(pool, author.id, tags);
  }

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm font-medium text-violet-700 hover:underline">
        ← Back to discovery
      </Link>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">{author.name}</h1>
        {author.orcid && (
          <p className="mt-1 text-sm text-slate-600">
            ORCID:{" "}
            <a className="text-violet-700 hover:underline" href={`https://orcid.org/${author.orcid}`}>
              {author.orcid}
            </a>
          </p>
        )}
        <div className="mt-4">
          <h2 className="text-sm font-semibold uppercase text-slate-500">AI research interest tags</h2>
          <p className="text-xs text-slate-500">
            Generated from aggregated titles/abstracts; coarse themes only — not a career profile.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.length === 0 && <span className="text-sm text-slate-500">No tags yet.</span>}
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-violet-50 px-3 py-1 text-sm text-violet-900">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Aggregated papers</h2>
        {papers.length === 0 && <p className="text-sm text-slate-500">No linked papers.</p>}
        {papers.map((p) => (
          <ResearchCard key={p.id} paper={p} compact />
        ))}
      </section>
    </div>
  );
}
