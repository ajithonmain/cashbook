import { createSession, type Env } from "../../../server/lib/auth";
import { hashPassword, safeEqualStrings } from "../../../server/lib/crypto";
import { clientIp, guard, HttpError, json, readJson } from "../../../server/lib/http";
import { isLimited, recordAttempt } from "../../../server/lib/ratelimit";
import { validateDeviceName, validateEmail, validatePassword } from "../../../server/lib/validate";

export const onRequestPost: PagesFunction<Env> = guard(async ({ request, env }) => {
  const ipKey = `register:${clientIp(request)}`;
  if (await isLimited(env.DB, ipKey, 10, 60 * 60 * 1000)) {
    throw new HttpError(429, "Too many attempts. Try again later.");
  }

  const body = await readJson<Record<string, unknown>>(request);
  const email = validateEmail(body.email);
  const password = validatePassword(body.password);
  const deviceName = validateDeviceName(body.deviceName);

  const open = env.ALLOW_SIGNUP === "true";
  if (!open) {
    if (!env.INVITE_CODE) throw new HttpError(403, "Registration is closed on this server");
    const supplied = typeof body.inviteCode === "string" ? body.inviteCode.trim() : "";
    if (!(await safeEqualStrings(supplied, env.INVITE_CODE))) {
      await recordAttempt(env.DB, ipKey);
      throw new HttpError(403, "Invalid invite code");
    }
  }
  await recordAttempt(env.DB, ipKey);

  const userId = crypto.randomUUID();
  try {
    await env.DB.prepare("INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)")
      .bind(userId, email, await hashPassword(password), Date.now())
      .run();
  } catch (e) {
    if (String(e).includes("UNIQUE")) throw new HttpError(409, "An account with this email already exists");
    throw e;
  }

  const { token } = await createSession(env.DB, userId, deviceName);
  return json({ token, user: { id: userId, email } }, 201);
});
