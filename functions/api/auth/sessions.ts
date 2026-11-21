import type { AuthData, Env } from "../../../server/lib/auth";
import { guard, HttpError, json } from "../../../server/lib/http";

export const onRequestGet: PagesFunction<Env, string, AuthData> = guard(async ({ env, data }) => {
  const { results } = await env.DB.prepare(
    "SELECT id, device_name, created_at, last_seen_at FROM sessions WHERE user_id = ? ORDER BY last_seen_at DESC"
  )
    .bind(data.user.id)
    .all<{ id: string; device_name: string; created_at: number; last_seen_at: number }>();

  return json({
    sessions: results.map((s) => ({
      id: s.id,
      deviceName: s.device_name,
      createdAt: s.created_at,
      lastSeenAt: s.last_seen_at,
      current: s.id === data.sessionId,
    })),
  });
});

export const onRequestDelete: PagesFunction<Env, string, AuthData> = guard(async ({ request, env, data }) => {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) throw new HttpError(400, "id is required");
  await env.DB.prepare("DELETE FROM sessions WHERE id = ? AND user_id = ?").bind(id, data.user.id).run();
  return json({ ok: true });
});
