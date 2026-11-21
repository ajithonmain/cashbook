import type { AuthData, Env } from "../../../server/lib/auth";
import { guard, json } from "../../../server/lib/http";

export const onRequestGet: PagesFunction<Env, string, AuthData> = guard(async ({ data }) => {
  return json({ user: data.user, sessionId: data.sessionId });
});
