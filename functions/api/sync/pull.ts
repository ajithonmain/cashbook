import type { AuthData, Env } from "../../../server/lib/auth";
import { guard, HttpError, json } from "../../../server/lib/http";

const PAGE_SIZE = 500;

interface BookRow {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
  deleted: number;
  synced_at: number;
}

interface TxnRow {
  id: string;
  book_id: string;
  type: "in" | "out";
  amount: number;
  category: string;
  party: string;
  payment_mode: string;
  remarks: string;
  occurred_at: number;
  created_at: number;
  updated_at: number;
  deleted: number;
  synced_at: number;
}

/**
 * Cursor pagination on the server clock (synced_at). `>=` (not `>`) so rows written in
 * the same millisecond as the previous page's last row are never skipped; clients upsert
 * idempotently so the occasional repeat is harmless.
 */
export const onRequestGet: PagesFunction<Env, string, AuthData> = guard(async ({ request, env, data }) => {
  const since = Number(new URL(request.url).searchParams.get("since") ?? "0");
  if (!Number.isFinite(since) || since < 0) throw new HttpError(400, "since is invalid");
  const userId = data.user.id;

  const [booksRes, txnsRes] = await Promise.all([
    env.DB.prepare("SELECT * FROM books WHERE user_id = ? AND synced_at >= ? ORDER BY synced_at, id LIMIT ?")
      .bind(userId, since, PAGE_SIZE)
      .all<BookRow>(),
    env.DB.prepare("SELECT * FROM transactions WHERE user_id = ? AND synced_at >= ? ORDER BY synced_at, id LIMIT ?")
      .bind(userId, since, PAGE_SIZE)
      .all<TxnRow>(),
  ]);

  const books = booksRes.results;
  const txns = txnsRes.results;
  const booksFull = books.length === PAGE_SIZE;
  const txnsFull = txns.length === PAGE_SIZE;

  // If a table hit the page limit, the next cursor must not pass that table's last row.
  // Otherwise we are caught up to the newest row we saw.
  const lastBook = books.at(-1)?.synced_at;
  const lastTxn = txns.at(-1)?.synced_at;
  const limited = [booksFull ? lastBook : undefined, txnsFull ? lastTxn : undefined].filter(
    (v): v is number => v !== undefined
  );
  const newest = Math.max(since, lastBook ?? 0, lastTxn ?? 0);
  const cursor = limited.length > 0 ? Math.min(...limited) : newest;

  return json({
    books: books.map((r) => ({
      id: r.id,
      name: r.name,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      deleted: r.deleted === 1,
    })),
    transactions: txns.map((r) => ({
      id: r.id,
      bookId: r.book_id,
      type: r.type,
      amount: r.amount,
      category: r.category,
      party: r.party,
      paymentMode: r.payment_mode,
      remarks: r.remarks,
      occurredAt: r.occurred_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      deleted: r.deleted === 1,
    })),
    cursor,
    hasMore: limited.length > 0,
  });
});
