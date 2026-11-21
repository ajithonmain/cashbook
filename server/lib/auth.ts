import { randomToken, sha256Hex } from "./crypto";
import { HttpError } from "./http";

export interface Env {
  DB: D1Database;
  /** "true" lets anyone create an account. Otherwise INVITE_CODE is required. */
  ALLOW_SIGNUP?: string;
  /** Shared secret an invitee must supply to register when signup is not open. */
  INVITE_CODE?: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthData extends Record<string, unknown> {
  user: AuthUser;
  sessionId: string;
}

export const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const TOUCH_INTERVAL_MS = 24 * 60 * 60 * 1000;

export async function createSession(db: D1Database, userId: string, deviceName: string) {
  const token = randomToken(32);
  const now = Date.now();
  const id = crypto.randomUUID();
  await db
    .prepare(
      "INSERT INTO sessions (id, user_id, token_hash, device_name, created_at, last_seen_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(id, userId, await sha256Hex(token), deviceName, now, now, now + SESSION_TTL_MS)
    .run();
  return { token, sessionId: id };
}

export async function authenticate(request: Request, db: D1Database): Promise<AuthData> {
  const header = request.headers.get("Authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) throw new HttpError(401, "Not signed in");

  const row = await db
    .prepare(
      `SELECT s.id AS session_id, s.last_seen_at, s.expires_at, u.id AS user_id, u.email
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`
    )
    .bind(await sha256Hex(match[1].trim()))
    .first<{ session_id: string; last_seen_at: number; expires_at: number; user_id: string; email: string }>();

  const now = Date.now();
  if (!row || row.expires_at < now) throw new HttpError(401, "Session expired");

  if (now - row.last_seen_at > TOUCH_INTERVAL_MS) {
    await db
      .prepare("UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE id = ?")
      .bind(now, now + SESSION_TTL_MS, row.session_id)
      .run();
  }
  return { user: { id: row.user_id, email: row.email }, sessionId: row.session_id };
}
