import type { AuthData, Env } from "../../../server/lib/auth";
import { hashPassword, verifyPassword } from "../../../server/lib/crypto";
import { guard, HttpError, json, readJson } from "../../../server/lib/http";
import { validatePassword } from "../../../server/lib/validate";

export const onRequestPost: PagesFunction<Env, string, AuthData> = guard(async ({ request, env, data }) => {
  const body = await readJson<Record<string, unknown>>(request);
  const current = typeof body.currentPassword === "string" ? body.currentPassword.slice(0, 128) : "";
  const next = validatePassword(body.newPassword);

  const row = await env.DB.prepare("SELECT password_hash FROM users WHERE id = ?")
    .bind(data.user.id)
    .first<{ password_hash: string }>();
  if (!row || !(await verifyPassword(current, row.password_hash))) {
    throw new HttpError(401, "Current password is incorrect");
  }

  await env.DB.batch([
    env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(await hashPassword(next), data.user.id),
    // Sign out every other device so a stolen session cannot survive a password change.
    env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND id != ?").bind(data.user.id, data.sessionId),
  ]);
  return json({ ok: true });
});
