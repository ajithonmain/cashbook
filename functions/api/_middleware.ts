import { authenticate, type AuthData, type Env } from "../../server/lib/auth";
import { guard } from "../../server/lib/http";

// Scoped to /api/* on purpose: a root middleware would invoke a Function for every
// static asset request and burn through the free Functions quota.
const PUBLIC_PATHS = new Set(["/api/health", "/api/auth/login", "/api/auth/register"]);

export const onRequest: PagesFunction<Env, string, AuthData> = guard(async (context) => {
  const { pathname } = new URL(context.request.url);
  if (!PUBLIC_PATHS.has(pathname)) {
    const auth = await authenticate(context.request, context.env.DB);
    context.data.user = auth.user;
    context.data.sessionId = auth.sessionId;
  }
  return context.next();
});
