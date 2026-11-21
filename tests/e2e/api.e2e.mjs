// End-to-end API test. Needs a running server with INVITE_CODE set:
//   printf "INVITE_CODE=test-invite-123\n" > .dev.vars
//   npm run build && npm run db:migrate:local && npx wrangler pages dev dist --port 8788
//   npm run test:e2e      (in another terminal)
// Registers throwaway users, so run it only against a local or disposable database.
const BASE = (process.env.BASE_URL ?? "http://localhost:8788") + "/api";
let pass = 0;
let fail = 0;

async function call(path, { method = "GET", body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data };
}

function check(name, cond, extra = "") {
  if (cond) pass++;
  else fail++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  " + extra}`);
}

const INVITE = process.env.INVITE_CODE ?? "test-invite-123";
const now = Date.now();
const book = (id, name, updatedAt) => ({ id, name, createdAt: now, updatedAt });
const txn = (id, bookId, amount, updatedAt) => ({
  id, bookId, type: "in", amount, category: "Salary", party: "Acme", paymentMode: "Cash", remarks: "",
  occurredAt: now, createdAt: now, updatedAt,
});

const emailA = `a${now}@example.com`;
const emailB = `b${now}@example.com`;

// Registration gating
let r = await call("/auth/register", { method: "POST", body: { email: emailA, password: "password123" } });
check("register without invite -> 403", r.status === 403, JSON.stringify(r));
r = await call("/auth/register", { method: "POST", body: { email: emailA, password: "password123", inviteCode: "wrong" } });
check("register wrong invite -> 403", r.status === 403);
r = await call("/auth/register", { method: "POST", body: { email: emailA, password: "short", inviteCode: INVITE } });
check("register weak password -> 400", r.status === 400);
r = await call("/auth/register", { method: "POST", body: { email: emailA, password: "password123", inviteCode: INVITE } });
check("register A ok -> 201", r.status === 201 && r.data.token && r.data.user.email === emailA, JSON.stringify(r));
const tokenA1 = r.data.token;
const userA = r.data.user.id;
r = await call("/auth/register", { method: "POST", body: { email: emailA, password: "password123", inviteCode: INVITE } });
check("duplicate email -> 409", r.status === 409);

// Auth required
r = await call("/sync/pull?since=0");
check("pull without token -> 401", r.status === 401);
r = await call("/sync/pull?since=0", { token: "bogus" });
check("pull with bogus token -> 401", r.status === 401);

// Login on a second device
r = await call("/auth/login", { method: "POST", body: { email: emailA, password: "nope-nope" } });
check("login wrong password -> 401", r.status === 401);
r = await call("/auth/login", { method: "POST", body: { email: "nobody@example.com", password: "whatever12" } });
check("login unknown email -> 401 (same as wrong password)", r.status === 401);
r = await call("/auth/login", { method: "POST", body: { email: emailA, password: "password123", deviceName: "Phone" } });
check("login device 2 ok", r.status === 200 && r.data.token);
const tokenA2 = r.data.token;

// Sync: device 1 pushes, device 2 pulls
r = await call("/sync/push", { method: "POST", token: tokenA1, body: { items: [
  { entity: "book", payload: book("b1", "Personal", now) },
  { entity: "transaction", payload: txn("t1", "b1", 500, now) },
] } });
check("push ok", r.status === 200 && r.data.accepted === 2, JSON.stringify(r));
r = await call("/sync/pull?since=0", { token: tokenA2 });
check("device 2 pulls device 1's data", r.status === 200 && r.data.books.length === 1 && r.data.transactions.length === 1 && r.data.transactions[0].amount === 500, JSON.stringify(r.data));
const cursorBefore = r.data.cursor;

// Server-clock cursor: an OLD client timestamp pushed later must still reach other devices
await new Promise((s) => setTimeout(s, 20));
r = await call("/sync/push", { method: "POST", token: tokenA2, body: { items: [{ entity: "transaction", payload: txn("t-old", "b1", 77, now - 7 * 86400000) }] } });
check("push week-old edit ok", r.status === 200);
r = await call(`/sync/pull?since=${cursorBefore}`, { token: tokenA1 });
check("week-old offline edit still delivered via synced_at cursor", r.data.transactions.some((t) => t.id === "t-old"), JSON.stringify(r.data));

// LWW
r = await call("/sync/push", { method: "POST", token: tokenA1, body: { items: [{ entity: "transaction", payload: txn("t1", "b1", 999, now - 1000) }] } });
r = await call("/sync/pull?since=0", { token: tokenA1 });
check("stale edit (older updatedAt) is ignored", r.data.transactions.find((t) => t.id === "t1").amount === 500);
r = await call("/sync/push", { method: "POST", token: tokenA1, body: { items: [{ entity: "transaction", payload: txn("t1", "b1", 750, now + 1000) }] } });
r = await call("/sync/pull?since=0", { token: tokenA2 });
check("newer edit wins", r.data.transactions.find((t) => t.id === "t1").amount === 750);

// Validation
r = await call("/sync/push", { method: "POST", token: tokenA1, body: { items: [{ entity: "transaction", payload: txn("t2", "b1", -5, now) }] } });
check("negative amount rejected -> 400", r.status === 400);
r = await call("/sync/push", { method: "POST", token: tokenA1, body: { items: [{ entity: "user", payload: {} }] } });
check("unknown entity rejected -> 400", r.status === 400);

// Isolation between users
r = await call("/auth/register", { method: "POST", body: { email: emailB, password: "password456", inviteCode: INVITE } });
const tokenB = r.data.token;
r = await call("/sync/pull?since=0", { token: tokenB });
check("user B sees none of A's data", r.data.books.length === 0 && r.data.transactions.length === 0);
r = await call("/sync/push", { method: "POST", token: tokenB, body: { items: [
  { entity: "book", payload: book("b1", "B's book", now + 5000) },
  { entity: "transaction", payload: txn("t1", "b1", 1, now + 5000) },
] } });
check("B can push the same ids", r.status === 200);
r = await call("/sync/pull?since=0", { token: tokenA1 });
check("A's data untouched by B's same-id push", r.data.books.find((b) => b.id === "b1").name === "Personal" && r.data.transactions.find((t) => t.id === "t1").amount === 750);
r = await call("/sync/pull?since=0", { token: tokenB });
check("B has only B's data", r.data.books.length === 1 && r.data.books[0].name === "B's book");

// Sessions
r = await call("/auth/sessions", { token: tokenA1 });
check("sessions lists 2 devices, one current", r.data.sessions.length === 2 && r.data.sessions.filter((s) => s.current).length === 1);
const other = r.data.sessions.find((s) => !s.current);
r = await call(`/auth/sessions?id=${other.id}`, { method: "DELETE", token: tokenA1 });
r = await call("/auth/me", { token: tokenA2 });
check("revoked device is signed out -> 401", r.status === 401);
r = await call("/auth/me", { token: tokenA1 });
check("current device still signed in", r.status === 200 && r.data.user.id === userA);
r = await call(`/auth/sessions?id=${(await call("/auth/sessions", { token: tokenB })).data.sessions[0].id}`, { method: "DELETE", token: tokenA1 });
r = await call("/auth/me", { token: tokenB });
check("cannot revoke another user's session", r.status === 200);

// Password change
r = await call("/auth/login", { method: "POST", body: { email: emailA, password: "password123" } });
const tokenA3 = r.data.token;
r = await call("/auth/password", { method: "POST", token: tokenA1, body: { currentPassword: "WRONG-pass", newPassword: "newpassword789" } });
check("change password with wrong current -> 401", r.status === 401);
r = await call("/auth/password", { method: "POST", token: tokenA1, body: { currentPassword: "password123", newPassword: "newpassword789" } });
check("change password ok", r.status === 200);
r = await call("/auth/me", { token: tokenA3 });
check("other devices signed out after password change", r.status === 401);
r = await call("/auth/login", { method: "POST", body: { email: emailA, password: "newpassword789" } });
check("login with new password", r.status === 200);

// Rate limiting
let limited = false;
for (let i = 0; i < 12; i++) {
  r = await call("/auth/login", { method: "POST", body: { email: emailB, password: "bad-password-" + i } });
  if (r.status === 429) limited = true;
}
check("login rate limit kicks in -> 429", limited);
r = await call("/auth/login", { method: "POST", body: { email: emailB, password: "password456" } });
check("correct password also blocked while limited", r.status === 429);

// Account deletion
r = await call("/auth/account", { method: "DELETE", token: tokenA1, body: { password: "wrong-password" } });
check("delete account wrong password -> 401", r.status === 401);
r = await call("/auth/account", { method: "DELETE", token: tokenA1, body: { password: "newpassword789" } });
check("delete account ok", r.status === 200);
r = await call("/auth/me", { token: tokenA1 });
check("deleted account's token is dead", r.status === 401);
r = await call("/sync/pull?since=0", { token: tokenB });
check("B's data survives A's deletion", r.data.books.length === 1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
