import { getPool } from "@/lib/db/pool";
import { insertPaper, upsertAuthorsForPaper } from "@/lib/db/papers.repository";
import { crossSourceDedupeKey } from "@/services/ingestion/dedupe";
import { ingestPubMedRecent, type IngestedPaper as PubmedPaper } from "@/services/ingestion/pubmed";
import { ingestArxivRecent, type IngestedPaper as ArxivPaper } from "@/services/ingestion/arxiv";
import { ingestBioRxivRecent, type IngestedPaper as BiorxivPaper } from "@/services/ingestion/biorxiv";

type AnyIngested = PubmedPaper | ArxivPaper | BiorxivPaper;

export async function runIngestionPipeline(params?: { perSource?: number }): Promise<{ insertedOrUpdated: number }> {
  const perSource = params?.perSource ?? 20;
  const pool = getPool();

  const [a, b, c] = await Promise.all([
    ingestPubMedRecent(perSource),
    ingestArxivRecent(perSource),
    ingestBioRxivRecent(perSource),
  ]);

  const merged = new Map<string, AnyIngested>();
  const order: string[] = [];

  const add = (p: AnyIngested) => {
    const key = crossSourceDedupeKey(p.doi, p.url, p.source, p.external_id);
    if (!merged.has(key)) {
      merged.set(key, p);
      order.push(key);
    }
  };

  for (const p of a) add(p);
  for (const p of b) add(p);
  for (const p of c) add(p);

  let insertedOrUpdated = 0;
  for (const key of order) {
    const p = merged.get(key)!;
    const id = await insertPaper(pool, {
      source: p.source,
      external_id: p.external_id,
      dedupe_hash: key,
      title: p.title,
      abstract: p.abstract,
      published_at: p.published_at,
      doi: p.doi,
      url: p.url,
      journal: p.journal,
      keywords: p.keywords,
      biomedical_score: p.biomedical_score,
      raw_json: p.raw,
    });
    await upsertAuthorsForPaper(pool, id, p.authors);
    insertedOrUpdated += 1;
  }

  return { insertedOrUpdated };
}
