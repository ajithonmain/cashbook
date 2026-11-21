interface Env {
  CASHBOOK_TOKEN: string;
}

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  const auth = request.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!env.CASHBOOK_TOKEN || token !== env.CASHBOOK_TOKEN) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return next();
};
