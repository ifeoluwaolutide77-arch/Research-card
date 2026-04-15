import type { Pool } from "pg";
import type { PaperSummaryRecord, SummaryConfidence } from "@/lib/types/models";

export async function upsertSummary(
  pool: Pool,
  input: {
    paper_id: string;
    one_liner: string | null;
    problem: string | null;
    objective: string | null;
    methods: string | null;
    results: string | null;
    limitations: string | null;
    improvements: string | null;
    tags: string[];
    model: string | null;
    ai_disclaimer: string;
    source_label: string;
    confidence: SummaryConfidence;
    confidence_numeric: number | null;
    uncertain: boolean;
    uncertainty_notes: string | null;
  },
): Promise<void> {
  await pool.query(
    `INSERT INTO paper_summaries (
      paper_id, one_liner, problem, objective, methods, results, limitations, improvements,
      tags, model, ai_disclaimer, source_label, confidence, confidence_numeric, uncertain, uncertainty_notes, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())
    ON CONFLICT (paper_id) DO UPDATE SET
      one_liner = EXCLUDED.one_liner,
      problem = EXCLUDED.problem,
      objective = EXCLUDED.objective,
      methods = EXCLUDED.methods,
      results = EXCLUDED.results,
      limitations = EXCLUDED.limitations,
      improvements = EXCLUDED.improvements,
      tags = EXCLUDED.tags,
      model = EXCLUDED.model,
      ai_disclaimer = EXCLUDED.ai_disclaimer,
      source_label = EXCLUDED.source_label,
      confidence = EXCLUDED.confidence,
      confidence_numeric = EXCLUDED.confidence_numeric,
      uncertain = EXCLUDED.uncertain,
      uncertainty_notes = EXCLUDED.uncertainty_notes,
      updated_at = NOW()`,
    [
      input.paper_id,
      input.one_liner,
      input.problem,
      input.objective,
      input.methods,
      input.results,
      input.limitations,
      input.improvements,
      input.tags,
      input.model,
      input.ai_disclaimer,
      input.source_label,
      input.confidence,
      input.confidence_numeric,
      input.uncertain,
      input.uncertainty_notes,
    ],
  );
}

export async function listPapersMissingSummaries(pool: Pool, limit: number): Promise<string[]> {
  const res = await pool.query<{ id: string }>(
    `SELECT p.id FROM papers p
     LEFT JOIN paper_summaries s ON s.paper_id = p.id
     WHERE s.paper_id IS NULL
     ORDER BY COALESCE(p.published_at, p.created_at) DESC NULLS LAST
     LIMIT $1`,
    [limit],
  );
  return res.rows.map((r) => r.id);
}

export async function getSummary(pool: Pool, paperId: string): Promise<PaperSummaryRecord | null> {
  const res = await pool.query(`SELECT * FROM paper_summaries WHERE paper_id = $1`, [paperId]);
  if (!res.rowCount) return null;
  return res.rows[0] as PaperSummaryRecord;
}
