import { NextRequest, NextResponse } from "next/server";
import { tryGetPool } from "@/lib/db/pool";
import { listPapersWithSummaries, listPaperRecords } from "@/lib/db/hydration";
import { buildDiscoveryLists } from "@/services/ranking/discovery";
import type { PaperSource } from "@/lib/types/models";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const pool = tryGetPool();
  if (!pool) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured", papers: [], discovery: null },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const source = (searchParams.get("source") as PaperSource | null) ?? undefined;
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 40)));
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));

  if (q || source) {
    const { searchPapers } = await import("@/lib/db/papers.repository");
    const rows = await searchPapers(pool, { q, source, limit, offset });
    const detailed: Awaited<ReturnType<typeof listPapersWithSummaries>> = [];
    for (const p of rows) {
      const full = await (await import("@/lib/db/papers.repository")).getPaperById(pool, p.id);
      if (full) detailed.push(full);
    }
    const records = await listPaperRecords(pool, 400);
    const discovery = buildDiscoveryLists(detailed, records);
    return NextResponse.json({ papers: detailed, discovery });
  }

  const papers = await listPapersWithSummaries(pool, 120);
  const records = await listPaperRecords(pool, 400);
  const discovery = buildDiscoveryLists(papers, records);
  const sliced = papers.slice(offset, offset + limit);
  return NextResponse.json({ papers: sliced, discovery });
}
