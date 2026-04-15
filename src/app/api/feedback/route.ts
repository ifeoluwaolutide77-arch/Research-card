import { NextRequest, NextResponse } from "next/server";
import { tryGetPool } from "@/lib/db/pool";
import { submitFeedback } from "@/services/feedback/feedbackService";
import { fingerprintFromHeaders } from "@/services/feedback/fingerprint";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const pool = tryGetPool();
  if (!pool) {
    return NextResponse.json({ error: "DATABASE_URL is not configured" }, { status: 503 });
  }
  const body = (await req.json()) as { paperId?: string; vote?: number };
  const paperId = body.paperId;
  const vote = body.vote;
  if (!paperId || (vote !== 1 && vote !== -1)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const fingerprint = fingerprintFromHeaders(req.headers);
  const result = await submitFeedback({ pool, paperId, vote: vote as 1 | -1, fingerprint });
  if (!result.ok) {
    const status = result.reason.startsWith("throttled") ? 429 : 400;
    return NextResponse.json({ ok: false, reason: result.reason }, { status });
  }
  return NextResponse.json({ ok: true });
}
