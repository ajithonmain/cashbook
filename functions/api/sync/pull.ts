interface Env {
  DB: D1Database;
  CASHBOOK_TOKEN: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const since = Number(url.searchParams.get("since") ?? "0");
  const serverTime = Date.now();

  const booksRes = await env.DB.prepare("SELECT * FROM books WHERE updated_at > ?").bind(since).all();
  const txnsRes = await env.DB.prepare("SELECT * FROM transactions WHERE updated_at > ?").bind(since).all();

  const books = (booksRes.results ?? []).map((r: Record<string, unknown>) => ({
    id: r.id,
    name: r.name,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deleted: Boolean(r.deleted),
  }));

  const transactions = (txnsRes.results ?? []).map((r: Record<string, unknown>) => ({
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
    deleted: Boolean(r.deleted),
  }));

  return Response.json({ books, transactions, serverTime });
};
