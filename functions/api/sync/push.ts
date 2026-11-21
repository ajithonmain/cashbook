import type { AuthData, Env } from "../../../server/lib/auth";
import { guard, json, readJson } from "../../../server/lib/http";
import { validateSyncItems } from "../../../server/lib/validate";

// Last-write-wins is enforced inside SQL (the WHERE on DO UPDATE), so a stale
// offline edit can never overwrite a newer one, even under concurrent pushes.
const UPSERT_BOOK = `
INSERT INTO books (user_id, id, name, created_at, updated_at, deleted, synced_at)
VALUES (?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(user_id, id) DO UPDATE SET
  name = excluded.name, updated_at = excluded.updated_at,
  deleted = excluded.deleted, synced_at = excluded.synced_at
WHERE excluded.updated_at > books.updated_at`;

const UPSERT_TXN = `
INSERT INTO transactions
  (user_id, id, book_id, type, amount, category, party, payment_mode, remarks,
   occurred_at, created_at, updated_at, deleted, synced_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(user_id, id) DO UPDATE SET
  type = excluded.type, amount = excluded.amount, category = excluded.category,
  party = excluded.party, payment_mode = excluded.payment_mode, remarks = excluded.remarks,
  occurred_at = excluded.occurred_at, updated_at = excluded.updated_at,
  deleted = excluded.deleted, synced_at = excluded.synced_at
WHERE excluded.updated_at > transactions.updated_at`;

export const onRequestPost: PagesFunction<Env, string, AuthData> = guard(async ({ request, env, data }) => {
  const items = validateSyncItems(await readJson(request));
  const userId = data.user.id;
  const now = Date.now();

  const statements = items.map((item) => {
    if (item.entity === "book") {
      const b = item.payload;
      return env.DB.prepare(UPSERT_BOOK).bind(userId, b.id, b.name, b.createdAt, b.updatedAt, b.deleted ? 1 : 0, now);
    }
    const t = item.payload;
    return env.DB.prepare(UPSERT_TXN).bind(
      userId,
      t.id,
      t.bookId,
      t.type,
      t.amount,
      t.category,
      t.party,
      t.paymentMode,
      t.remarks,
      t.occurredAt,
      t.createdAt,
      t.updatedAt,
      t.deleted ? 1 : 0,
      now
    );
  });

  if (statements.length > 0) await env.DB.batch(statements);
  return json({ ok: true, accepted: items.length });
});
