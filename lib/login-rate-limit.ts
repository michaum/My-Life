import { database } from "@/db/raw";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const BLOCK_MINUTES = 15;

export async function checkLoginRateLimit(key: string) {
  const db = database();
  const row = await db
    .prepare(
      `SELECT attempts, window_started_at AS windowStartedAt, blocked_until AS blockedUntil
       FROM login_rate_limits
       WHERE key = ?
       LIMIT 1`,
    )
    .bind(key)
    .first<{
      attempts: number;
      windowStartedAt: string;
      blockedUntil: string | null;
    }>();

  if (!row) return { blocked: false };

  const now = Date.now();

  if (row.blockedUntil && new Date(row.blockedUntil).getTime() > now) {
    return { blocked: true };
  }

  const windowStart = new Date(row.windowStartedAt).getTime();
  if (now - windowStart > WINDOW_MINUTES * 60_000) {
    await db.prepare("DELETE FROM login_rate_limits WHERE key = ?").bind(key).run();
  }

  return { blocked: false };
}

export async function recordFailedLogin(key: string) {
  const db = database();
  const now = new Date();
  const existing = await db
    .prepare(
      `SELECT attempts, window_started_at AS windowStartedAt
       FROM login_rate_limits
       WHERE key = ?
       LIMIT 1`,
    )
    .bind(key)
    .first<{ attempts: number; windowStartedAt: string }>();

  if (!existing || now.getTime() - new Date(existing.windowStartedAt).getTime() > WINDOW_MINUTES * 60_000) {
    await db
      .prepare(
        `INSERT INTO login_rate_limits(key, attempts, window_started_at, blocked_until)
         VALUES(?, 1, ?, NULL)
         ON CONFLICT(key) DO UPDATE SET
           attempts = 1,
           window_started_at = excluded.window_started_at,
           blocked_until = NULL`,
      )
      .bind(key, now.toISOString())
      .run();
    return;
  }

  const attempts = existing.attempts + 1;
  const blockedUntil =
    attempts >= MAX_ATTEMPTS
      ? new Date(now.getTime() + BLOCK_MINUTES * 60_000).toISOString()
      : null;

  await db
    .prepare(
      `UPDATE login_rate_limits
       SET attempts = ?, blocked_until = ?
       WHERE key = ?`,
    )
    .bind(attempts, blockedUntil, key)
    .run();
}

export async function clearLoginRateLimit(key: string) {
  const db = database();
  await db.prepare("DELETE FROM login_rate_limits WHERE key = ?").bind(key).run();
}
