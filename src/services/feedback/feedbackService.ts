import type { Pool } from "pg";
import { countFeedbackForPaperSince, countFeedbackSince, insertFeedback } from "@/lib/db/feedback.repository";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 40;
const MAX_PER_PAPER_WINDOW = 6;

export type FeedbackResult =
  | { ok: true }
  | { ok: false; reason: "throttled_global" | "throttled_paper" | "invalid" };

export async function submitFeedback(params: {
  pool: Pool;
  paperId: string;
  vote: 1 | -1;
  fingerprint: string;
}): Promise<FeedbackResult> {
  if (params.vote !== 1 && params.vote !== -1) return { ok: false, reason: "invalid" };
  const since = new Date(Date.now() - WINDOW_MS);
  const globalCount = await countFeedbackSince(params.pool, params.fingerprint, since);
  if (globalCount >= MAX_PER_WINDOW) return { ok: false, reason: "throttled_global" };
  const paperCount = await countFeedbackForPaperSince(
    params.pool,
    params.paperId,
    params.fingerprint,
    since,
  );
  if (paperCount >= MAX_PER_PAPER_WINDOW) return { ok: false, reason: "throttled_paper" };
  await insertFeedback(params.pool, {
    paper_id: params.paperId,
    vote: params.vote,
    fingerprint: params.fingerprint,
  });
  return { ok: true };
}
