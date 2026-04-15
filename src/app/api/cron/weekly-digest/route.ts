import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { tryGetPool } from "@/lib/db/pool";
import { listConfirmedSubscribers } from "@/lib/db/subscriptions.repository";
import { listPapersWithSummaries } from "@/lib/db/hydration";
import { sortByComposite, attachRankingSignals } from "@/services/ranking/signals";
import { renderDigestHtml, sendWeeklyDigestEmail } from "@/services/email/emailService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const env = getServerEnv();
  const secret = req.headers.get("x-cron-secret");
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pool = tryGetPool();
  if (!pool) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const subs = await listConfirmedSubscribers(pool);
  const papers = sortByComposite(attachRankingSignals(await listPapersWithSummaries(pool, 40))).slice(0, 10);
  const digestItems = papers.map((p) => ({
    title: p.title,
    url: p.url,
    one_liner: p.summary?.one_liner ?? null,
  }));
  const html = renderDigestHtml(digestItems);
  let sent = 0;
  for (const s of subs) {
    const r = await sendWeeklyDigestEmail({
      to: s.email,
      html,
      subject: "ResearchCard — weekly digest",
    });
    if (r.ok) sent += 1;
  }
  return NextResponse.json({ ok: true, subscribers: subs.length, sent });
}
