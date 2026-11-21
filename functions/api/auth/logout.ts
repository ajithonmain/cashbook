import type { AuthData, Env } from "../../../server/lib/auth";
import { guard, json } from "../../../server/lib/http";

export const onRequestPost: PagesFunction<Env, string, AuthData> = guard(async ({ env, data }) => {
  await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(data.sessionId).run();
  return json({ ok: true });
});
