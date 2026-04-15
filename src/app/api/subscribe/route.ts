import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { tryGetPool } from "@/lib/db/pool";
import { upsertSubscription } from "@/lib/db/subscriptions.repository";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  weeklyDigest: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  const pool = tryGetPool();
  if (!pool) {
    return NextResponse.json({ error: "DATABASE_URL is not configured" }, { status: 503 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  await upsertSubscription(pool, parsed.data.email, parsed.data.weeklyDigest);
  return NextResponse.json({
    ok: true,
    message:
      "Saved. In production, send a confirmation email (double opt-in) via Resend before flipping confirmed=true.",
  });
}
