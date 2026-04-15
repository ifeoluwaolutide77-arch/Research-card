import type { Pool } from "pg";
import type { AuthorRecord, PaperRecord, PaperSummaryRecord, PaperWithSummary, PaperSource } from "@/lib/types/models";
import { mapPaperRow, type RowPaper } from "@/lib/db/row-mapper";

export async function insertPaper(
  pool: Pool,
  input: {
    source: PaperSource;
    external_id: string;
    dedupe_hash: string;
    title: string;
    abstract: string | null;
    published_at: Date | null;
    doi: string | null;
    url: string;
    journal: string | null;
    keywords: string[];
    biomedical_score: number;
    raw_json: unknown;
  },
): Promise<string> {
  const res = await pool.query<{ id: string }>(
    `INSERT INTO papers (
      source, external_id, dedupe_hash, title, abstract, published_at, doi, url, journal, keywords, biomedical_score, raw_json
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)
    ON CONFLICT (dedupe_hash) DO UPDATE SET
      title = EXCLUDED.title,
      abstract = EXCLUDED.abstract,
      published_at = COALESCE(EXCLUDED.published_at, papers.published_at),
      doi = COALESCE(EXCLUDED.doi, papers.doi),
      url = EXCLUDED.url,
      journal = COALESCE(EXCLUDED.journal, papers.journal),
      keywords = EXCLUDED.keywords,
      biomedical_score = GREATEST(papers.biomedical_score, EXCLUDED.biomedical_score),
      raw_json = EXCLUDED.raw_json,
      updated_at = NOW()
    RETURNING id`,
    [
      input.source,
      input.external_id,
      input.dedupe_hash,
      input.title,
      input.abstract,
      input.published_at,
      input.doi,
      input.url,
      input.journal,
      input.keywords,
      input.biomedical_score,
      JSON.stringify(input.raw_json ?? {}),
    ],
  );
  return res.rows[0].id;
}

export async function upsertAuthorsForPaper(
  pool: Pool,
  paperId: string,
  authorNames: string[],
): Promise<void> {
  await pool.query("DELETE FROM paper_authors WHERE paper_id = $1", [paperId]);
  let position = 0;
  for (const name of authorNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const normalized = trimmed.toLowerCase();
    const a = await pool.query<{ id: string }>(
      `INSERT INTO authors (name, normalized_name)
       VALUES ($1, $2)
       ON CONFLICT (normalized_name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [trimmed, normalized],
    );
    const authorId = a.rows[0].id;
    await pool.query(
      `INSERT INTO paper_authors (paper_id, author_id, position) VALUES ($1,$2,$3)
       ON CONFLICT (paper_id, author_id) DO NOTHING`,
      [paperId, authorId, position],
    );
    position += 1;
  }
}

export async function listRecentPapers(pool: Pool, limit = 200): Promise<PaperRecord[]> {
  const res = await pool.query<RowPaper>(
    `SELECT * FROM papers ORDER BY COALESCE(published_at, created_at) DESC NULLS LAST LIMIT $1`,
    [limit],
  );
  return res.rows.map(mapPaperRow);
}

export async function getPaperById(pool: Pool, id: string): Promise<PaperWithSummary | null> {
  const paperRes = await pool.query<RowPaper>(`SELECT * FROM papers WHERE id = $1`, [id]);
  if (!paperRes.rowCount) return null;
  const paper = mapPaperRow(paperRes.rows[0]);

  const sumRes = await pool.query(
    `SELECT * FROM paper_summaries WHERE paper_id = $1`,
    [id],
  );
  const summary = sumRes.rows[0] as PaperSummaryRecord | undefined;

  const authRes = await pool.query(
    `SELECT a.id, a.name, pa.position
     FROM paper_authors pa
     JOIN authors a ON a.id = pa.author_id
     WHERE pa.paper_id = $1
     ORDER BY pa.position ASC`,
    [id],
  );

  const eng = await pool.query<{ up: string; down: string }>(
    `SELECT
       COALESCE(SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END), 0)::text AS up,
       COALESCE(SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END), 0)::text AS down
     FROM feedback WHERE paper_id = $1`,
    [id],
  );

  return {
    ...paper,
    summary: summary
      ? {
          ...summary,
          tags: summary.tags ?? [],
        }
      : null,
    authors: authRes.rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      position: Number(r.position),
    })),
    engagement: {
      thumbs_up: Number(eng.rows[0]?.up ?? 0),
      thumbs_down: Number(eng.rows[0]?.down ?? 0),
    },
  };
}

export async function searchPapers(
  pool: Pool,
  params: { q?: string; source?: PaperSource; limit: number; offset: number },
): Promise<PaperRecord[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (params.q) {
    conditions.push(
      `(title ILIKE $${i} OR abstract ILIKE $${i} OR EXISTS (
         SELECT 1 FROM unnest(keywords) k WHERE k ILIKE $${i}
       ))`,
    );
    values.push(`%${params.q}%`);
    i += 1;
  }
  if (params.source) {
    conditions.push(`source = $${i}`);
    values.push(params.source);
    i += 1;
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  values.push(params.limit, params.offset);
  const res = await pool.query<RowPaper>(
    `SELECT * FROM papers ${where}
     ORDER BY biomedical_score DESC, COALESCE(published_at, created_at) DESC NULLS LAST
     LIMIT $${i} OFFSET $${i + 1}`,
    values,
  );
  return res.rows.map(mapPaperRow);
}

export async function getAuthorById(pool: Pool, authorId: string): Promise<AuthorRecord | null> {
  const res = await pool.query(
    `SELECT id, name, normalized_name, orcid, research_tags FROM authors WHERE id = $1`,
    [authorId],
  );
  if (!res.rowCount) return null;
  const r = res.rows[0];
  return {
    id: r.id as string,
    name: r.name as string,
    normalized_name: r.normalized_name as string,
    orcid: (r.orcid as string | null) ?? null,
    research_tags: (r.research_tags as string[]) ?? [],
  };
}

export async function listPapersForAuthor(pool: Pool, authorId: string): Promise<PaperRecord[]> {
  const res = await pool.query<RowPaper>(
    `SELECT p.*
     FROM papers p
     JOIN paper_authors pa ON pa.paper_id = p.id
     WHERE pa.author_id = $1
     ORDER BY COALESCE(p.published_at, p.created_at) DESC NULLS LAST`,
    [authorId],
  );
  return res.rows.map(mapPaperRow);
}

export async function updateAuthorResearchTags(
  pool: Pool,
  authorId: string,
  tags: string[],
): Promise<void> {
  await pool.query(`UPDATE authors SET research_tags = $2 WHERE id = $1`, [authorId, tags]);
}
