import type { Env } from "../../server/lib/auth";
import { json } from "../../server/lib/http";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return json({
    ok: true,
    signup: env.ALLOW_SIGNUP === "true" ? "open" : env.INVITE_CODE ? "invite" : "closed",
  });
};
