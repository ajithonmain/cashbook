import { createSession, type Env } from "../../../server/lib/auth";
import { DUMMY_HASH, verifyPassword } from "../../../server/lib/crypto";
import { clientIp, guard, HttpError, json, readJson } from "../../../server/lib/http";
import { clearAttempts, isLimited, recordAttempt } from "../../../server/lib/ratelimit";
import { validateDeviceName, validateEmail } from "../../../server/lib/validate";

export const onRequestPost: PagesFunction<Env> = guard(async ({ request, env }) => {
  const body = await readJson<Record<string, unknown>>(request);
  const email = validateEmail(body.email);
  const password = typeof body.password === "string" ? body.password.slice(0, 128) : "";
  const deviceName = validateDeviceName(body.deviceName);

  const emailKey = `login:${email}`;
  const ipKey = `login-ip:${clientIp(request)}`;
  if ((await isLimited(env.DB, emailKey, 10, 15 * 60 * 1000)) || (await isLimited(env.DB, ipKey, 40, 15 * 60 * 1000))) {
    throw new HttpError(429, "Too many failed attempts. Try again in a few minutes.");
  }

  const user = await env.DB.prepare("SELECT id, email, password_hash FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: string; email: string; password_hash: string }>();

  const ok = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) {
    await recordAttempt(env.DB, emailKey);
    await recordAttempt(env.DB, ipKey);
    throw new HttpError(401, "Incorrect email or password");
  }

  await clearAttempts(env.DB, emailKey);
  const { token } = await createSession(env.DB, user.id, deviceName);
  return json({ token, user: { id: user.id, email: user.email } });
});
