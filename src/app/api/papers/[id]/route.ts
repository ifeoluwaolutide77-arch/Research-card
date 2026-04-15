import { NextResponse } from "next/server";
import { tryGetPool } from "@/lib/db/pool";
import { getPaperById } from "@/lib/db/papers.repository";
import { attachRankingSignals } from "@/services/ranking/signals";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  const pool = tryGetPool();
  if (!pool) {
    return NextResponse.json({ error: "DATABASE_URL is not configured" }, { status: 503 });
  }
  const paper = await getPaperById(pool, id);
  if (!paper) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const ranked = attachRankingSignals([paper])[0];
  return NextResponse.json({ paper: ranked });
}