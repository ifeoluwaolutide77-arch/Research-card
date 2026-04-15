import type { Pool } from "pg";
import type { PaperRecord, PaperSummaryRecord, PaperWithSummary } from "@/lib/types/models";
import { mapPaperRow, type RowPaper } from "@/lib/db/row-mapper";

export async function listPapersWithSummaries(pool: Pool, limit = 200): Promise<PaperWithSummary[]> {
  const res = await pool.query<RowPaper & { summary_json: unknown | null }>(
    `SELECT p.*, to_jsonb(s) AS summary_json
     FROM papers p
     LEFT JOIN paper_summaries s ON s.paper_id = p.id
     ORDER BY COALESCE(p.published_at, p.created_at) DESC NULLS LAST
     LIMIT $1`,
    [limit],
  );

  const papers: PaperWithSummary[] = [];
  for (const row of res.rows) {
    const paper = mapPaperRow(row);
    const summary = row.summary_json as PaperSummaryRecord | null;
    const authors = await pool.query(
      `SELECT a.id, a.name, pa.position
       FROM paper_authors pa
       JOIN authors a ON a.id = pa.author_id
       WHERE pa.paper_id = $1
       ORDER BY pa.position ASC`,
      [paper.id],
    );
    const eng = await pool.query<{ up: string; down: string }>(
      `SELECT
         COALESCE(SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END), 0)::text AS up,
         COALESCE(SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END), 0)::text AS down
       FROM feedback WHERE paper_id = $1`,
      [paper.id],
    );
    papers.push({
      ...paper,
      summary: summary && summary.paper_id ? { ...summary, tags: summary.tags ?? [] } : null,
      authors: authors.rows.map((r) => ({
        id: r.id as string,
        name: r.name as string,
        position: Number(r.position),
      })),
      engagement: {
        thumbs_up: Number(eng.rows[0]?.up ?? 0),
        thumbs_down: Number(eng.rows[0]?.down ?? 0),
      },
    });
  }
  return papers;
}

export async function listPaperRecords(pool: Pool, limit = 400): Promise<PaperRecord[]> {
  const res = await pool.query<RowPaper>(
    `SELECT * FROM papers ORDER BY COALESCE(published_at, created_at) DESC NULLS LAST LIMIT $1`,
    [limit],
  );
  return res.rows.map(mapPaperRow);
}
