import type { AuthData, Env } from "../../../server/lib/auth";
import { verifyPassword } from "../../../server/lib/crypto";
import { guard, HttpError, json, readJson } from "../../../server/lib/http";

export const onRequestDelete: PagesFunction<Env, string, AuthData> = guard(async ({ request, env, data }) => {
  const body = await readJson<Record<string, unknown>>(request);
  const password = typeof body.password === "string" ? body.password.slice(0, 128) : "";

  const row = await env.DB.prepare("SELECT password_hash FROM users WHERE id = ?")
    .bind(data.user.id)
    .first<{ password_hash: string }>();
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    throw new HttpError(401, "Password is incorrect");
  }

  const id = data.user.id;
  await env.DB.batch([
    env.DB.prepare("DELETE FROM transactions WHERE user_id = ?").bind(id),
    env.DB.prepare("DELETE FROM books WHERE user_id = ?").bind(id),
    env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id),
    env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id),
  ]);
  return json({ ok: true });
});
