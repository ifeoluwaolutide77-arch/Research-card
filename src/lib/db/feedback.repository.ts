import type { Pool } from "pg";

export async function countFeedbackSince(
  pool: Pool,
  fingerprint: string,
  since: Date,
): Promise<number> {
  const res = await pool.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM feedback WHERE fingerprint = $1 AND created_at >= $2`,
    [fingerprint, since],
  );
  return Number(res.rows[0]?.c ?? 0);
}

export async function countFeedbackForPaperSince(
  pool: Pool,
  paperId: string,
  fingerprint: string,
  since: Date,
): Promise<number> {
  const res = await pool.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM feedback
     WHERE paper_id = $1 AND fingerprint = $2 AND created_at >= $3`,
    [paperId, fingerprint, since],
  );
  return Number(res.rows[0]?.c ?? 0);
}

export async function insertFeedback(
  pool: Pool,
  input: { paper_id: string; vote: 1 | -1; fingerprint: string },
): Promise<void> {
  await pool.query(
    `INSERT INTO feedback (paper_id, vote, fingerprint) VALUES ($1,$2,$3)`,
    [input.paper_id, input.vote, input.fingerprint],
  );
}
