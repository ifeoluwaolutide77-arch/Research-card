import type { Pool } from "pg";
import { randomBytes } from "crypto";

export async function upsertSubscription(
  pool: Pool,
  email: string,
  weeklyDigest: boolean,
): Promise<{ id: string; confirm_token: string | null }> {
  const normalized = email.trim().toLowerCase();
  const token = randomBytes(24).toString("hex");
  const res = await pool.query<{ id: string; confirm_token: string | null }>(
    `INSERT INTO subscriptions (email, weekly_digest, confirm_token, confirmed)
     VALUES ($1, $2, $3, FALSE)
     ON CONFLICT (email) DO UPDATE SET
       weekly_digest = EXCLUDED.weekly_digest,
       confirm_token = COALESCE(subscriptions.confirm_token, EXCLUDED.confirm_token)
     RETURNING id, confirm_token`,
    [normalized, weeklyDigest, token],
  );
  return res.rows[0];
}

export async function listConfirmedSubscribers(pool: Pool): Promise<{ email: string }[]> {
  const res = await pool.query<{ email: string }>(
    `SELECT email FROM subscriptions WHERE confirmed = TRUE AND weekly_digest = TRUE`,
  );
  return res.rows;
}
