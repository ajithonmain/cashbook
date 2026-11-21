interface Env {
  DB: D1Database;
  CASHBOOK_TOKEN: string;
}

interface Book {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
}

interface Transaction {
  id: string;
  bookId: string;
  type: "in" | "out";
  amount: number;
  category: string;
  party: string;
  paymentMode: string;
  remarks: string;
  occurredAt: number;
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
}

interface SyncQueueItem {
  entity: "book" | "transaction";
  entityId: string;
  op: "put" | "delete";
  payload: Book | Transaction | null;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const item = (await request.json()) as SyncQueueItem;

  if (item.entity === "book") {
    const b = item.payload as Book;
    const existing = await env.DB.prepare("SELECT updated_at FROM books WHERE id = ?").bind(b.id).first<{ updated_at: number }>();
    if (existing && existing.updated_at >= b.updatedAt) {
      return Response.json({ ok: true, skipped: true });
    }
    await env.DB.prepare(
      `INSERT INTO books (id, name, created_at, updated_at, deleted)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, updated_at = excluded.updated_at, deleted = excluded.deleted`
    )
      .bind(b.id, b.name, b.createdAt, b.updatedAt, b.deleted ? 1 : 0)
      .run();
    return Response.json({ ok: true });
  }

  if (item.entity === "transaction") {
    const t = item.payload as Transaction;
    const existing = await env.DB.prepare("SELECT updated_at FROM transactions WHERE id = ?")
      .bind(t.id)
      .first<{ updated_at: number }>();
    if (existing && existing.updated_at >= t.updatedAt) {
      return Response.json({ ok: true, skipped: true });
    }
    await env.DB.prepare(
      `INSERT INTO transactions
         (id, book_id, type, amount, category, party, payment_mode, remarks, occurred_at, created_at, updated_at, deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         type = excluded.type, amount = excluded.amount, category = excluded.category,
         party = excluded.party, payment_mode = excluded.payment_mode, remarks = excluded.remarks,
         occurred_at = excluded.occurred_at, updated_at = excluded.updated_at, deleted = excluded.deleted`
    )
      .bind(
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
        t.deleted ? 1 : 0
      )
      .run();
    return Response.json({ ok: true });
  }

  return Response.json({ error: "unknown entity" }, { status: 400 });
};
