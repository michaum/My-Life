import { database } from "@/db/raw";
import {
  createSessionToken,
  hashSessionToken,
  readCookie,
  sessionExpiry,
} from "@/lib/auth";


async function cleanupExpiredSessions() {
  const db = database();
  const now = new Date().toISOString();

  await db
    .prepare("DELETE FROM sessions WHERE expires_at <= ?")
    .bind(now)
    .run();
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  personId: string | null;
};

export async function createSession(userId: string) {
  await cleanupExpiredSessions();

  const db = database();

  const token = createSessionToken();
  const tokenHash = await hashSessionToken(token);
  const expires = sessionExpiry();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO sessions(token_hash, user_id, expires_at, created_at)
       VALUES(?, ?, ?, ?)`,
    )
    .bind(tokenHash, userId, expires.toISOString(), now)
    .run();

  return {
    token,
    expires,
  };
}

export async function deleteSession(token: string) {
  const db = database();
  const tokenHash = await hashSessionToken(token);

  await db
    .prepare("DELETE FROM sessions WHERE token_hash = ?")
    .bind(tokenHash)
    .run();
}

export async function getCurrentUser(request: Request): Promise<AuthUser | null> {
  await cleanupExpiredSessions();

  const token = readCookie(request, "my_life_session");

  if (!token) return null;

  const db = database();
  const tokenHash = await hashSessionToken(token);
  const now = new Date().toISOString();

  const row = await db
    .prepare(
      `SELECT
         users.id,
         users.name,
         users.email,
         users.role,
         users.person_id AS personId
       FROM sessions
       INNER JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ?
         AND sessions.expires_at > ?
         AND users.active = 1
       LIMIT 1`,
    )
    .bind(tokenHash, now)
    .first<AuthUser>();

  return row ?? null;
}

export async function requireUser(request: Request) {
  const user = await getCurrentUser(request);

  if (!user) {
    return {
      user: null,
      response: Response.json(
        { error: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  return {
    user,
    response: null,
  };
}

export async function requireAdmin(request: Request) {
  const result = await requireUser(request);

  if (!result.user) {
    return result;
  }

  if (result.user.role !== "admin") {
    return {
      user: null,
      response: Response.json(
        { error: "Administrator access required." },
        { status: 403 },
      ),
    };
  }

  return result;
}
