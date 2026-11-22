import { deleteDB, openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Book, BookSettings, Transaction, SyncQueueItem } from "./types";

interface CashBookDB extends DBSchema {
  books: { key: string; value: Book; indexes: { updatedAt: number } };
  transactions: {
    key: string;
    value: Transaction;
    indexes: { bookId: string; occurredAt: number };
  };
  syncQueue: { key: string; value: SyncQueueItem };
  meta: { key: string; value: string | number };
}

/**
 * Each signed-in user gets their own IndexedDB database ("cashbook-<userId>"), so two
 * accounts on one browser never see each other's data. Signed-out use is the "local" scope.
 */
export const LOCAL_SCOPE = "local";
export const QUEUED_EVENT = "cashbook:queued";

let activeScope = LOCAL_SCOPE;
let dbPromise: Promise<IDBPDatabase<CashBookDB>> | null = null;

function dbName(scope: string): string {
  return scope === LOCAL_SCOPE ? "cashbook" : `cashbook-${scope}`;
}

function openScope(scope: string): Promise<IDBPDatabase<CashBookDB>> {
  return openDB<CashBookDB>(dbName(scope), 1, {
    upgrade(db) {
      const books = db.createObjectStore("books", { keyPath: "id" });
      books.createIndex("updatedAt", "updatedAt");

      const tx = db.createObjectStore("transactions", { keyPath: "id" });
      tx.createIndex("bookId", "bookId");
      tx.createIndex("occurredAt", "occurredAt");

      db.createObjectStore("syncQueue", { keyPath: "id" });
      db.createObjectStore("meta");
    },
  });
}

function getDB() {
  if (!dbPromise) dbPromise = openScope(activeScope);
  return dbPromise;
}

export function getScope(): string {
  return activeScope;
}

export function setScope(scope: string): void {
  if (scope === activeScope) return;
  const old = dbPromise;
  activeScope = scope;
  dbPromise = null;
  void old?.then((db) => db.close());
}

export async function destroyScope(scope: string): Promise<void> {
  if (scope === activeScope && dbPromise) {
    (await dbPromise).close();
    dbPromise = null;
  }
  await deleteDB(dbName(scope));
}

function uid() {
  return crypto.randomUUID();
}

async function enqueueSync(item: Omit<SyncQueueItem, "id" | "queuedAt">) {
  const db = await getDB();
  await db.put("syncQueue", { ...item, id: uid(), queuedAt: Date.now() });
  window.dispatchEvent(new Event(QUEUED_EVENT));
}

export async function listBooks(): Promise<Book[]> {
  const db = await getDB();
  const all = await db.getAll("books");
  return all.filter((b) => !b.deleted).sort((a, b) => b.updatedAt - a.updatedAt);
}

export interface BookStyleInput {
  icon: string;
  color: number;
}

export async function createBook(name: string, style: BookStyleInput): Promise<Book> {
  const db = await getDB();
  const now = Date.now();
  const book: Book = { id: uid(), name, icon: style.icon, color: style.color, createdAt: now, updatedAt: now };
  await db.put("books", book);
  await enqueueSync({ entity: "book", entityId: book.id, op: "put", payload: book });
  return book;
}

export async function updateBook(id: string, patch: { name: string } & BookStyleInput): Promise<void> {
  const db = await getDB();
  const book = await db.get("books", id);
  if (!book) return;
  const updated = { ...book, ...patch, updatedAt: Date.now() };
  await db.put("books", updated);
  await enqueueSync({ entity: "book", entityId: id, op: "put", payload: updated });
}

export async function updateBookSettings(id: string, settings: BookSettings): Promise<void> {
  const db = await getDB();
  const book = await db.get("books", id);
  if (!book) return;
  const updated = { ...book, settings, updatedAt: Date.now() };
  await db.put("books", updated);
  await enqueueSync({ entity: "book", entityId: id, op: "put", payload: updated });
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDB();
  const book = await db.get("books", id);
  if (!book) return;
  const now = Date.now();
  const updated = { ...book, deleted: true, updatedAt: now };
  await db.put("books", updated);
  await enqueueSync({ entity: "book", entityId: id, op: "delete", payload: updated });

  // Soft-delete the book's entries too, so other devices drop them and totals stay correct.
  const txns = await db.getAllFromIndex("transactions", "bookId", id);
  for (const t of txns) {
    if (t.deleted) continue;
    const gone = { ...t, deleted: true, updatedAt: now };
    await db.put("transactions", gone);
    await enqueueSync({ entity: "transaction", entityId: t.id, op: "delete", payload: gone });
  }
}

export async function listTransactions(bookId: string): Promise<Transaction[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("transactions", "bookId", bookId);
  return all.filter((t) => !t.deleted).sort((a, b) => b.occurredAt - a.occurredAt);
}

export async function addTransaction(
  input: Omit<Transaction, "id" | "createdAt" | "updatedAt">
): Promise<Transaction> {
  const db = await getDB();
  const now = Date.now();
  const txn: Transaction = { ...input, id: uid(), createdAt: now, updatedAt: now };
  await db.put("transactions", txn);
  const book = await db.get("books", input.bookId);
  if (book) {
    const touched = { ...book, updatedAt: now };
    await db.put("books", touched);
    await enqueueSync({ entity: "book", entityId: book.id, op: "put", payload: touched });
  }
  await enqueueSync({ entity: "transaction", entityId: txn.id, op: "put", payload: txn });
  return txn;
}

export async function updateTransaction(
  id: string,
  patch: Partial<Omit<Transaction, "id" | "bookId" | "createdAt">>
): Promise<void> {
  const db = await getDB();
  const existing = await db.get("transactions", id);
  if (!existing) return;
  const updated = { ...existing, ...patch, updatedAt: Date.now() };
  await db.put("transactions", updated);
  await enqueueSync({ entity: "transaction", entityId: id, op: "put", payload: updated });
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get("transactions", id);
  if (!existing) return;
  const updated = { ...existing, deleted: true, updatedAt: Date.now() };
  await db.put("transactions", updated);
  await enqueueSync({ entity: "transaction", entityId: id, op: "delete", payload: updated });
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  const all = await db.getAll("syncQueue");
  return all.sort((a, b) => a.queuedAt - b.queuedAt);
}

export async function countSyncQueue(): Promise<number> {
  const db = await getDB();
  return db.count("syncQueue");
}

export async function removeSyncItems(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("syncQueue", "readwrite");
  await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
}

export async function getMeta(key: string): Promise<string | number | undefined> {
  const db = await getDB();
  return db.get("meta", key);
}

export async function setMeta(key: string, value: string | number): Promise<void> {
  const db = await getDB();
  await db.put("meta", value, key);
}

export async function upsertBookFromRemote(book: Book): Promise<boolean> {
  const db = await getDB();
  const local = await db.get("books", book.id);
  if (!local || local.updatedAt < book.updatedAt) {
    await db.put("books", book);
    return true;
  }
  return false;
}

export async function upsertTransactionFromRemote(txn: Transaction): Promise<boolean> {
  const db = await getDB();
  const local = await db.get("transactions", txn.id);
  if (!local || local.updatedAt < txn.updatedAt) {
    await db.put("transactions", txn);
    return true;
  }
  return false;
}

export interface ScopeSnapshot {
  books: Book[];
  transactions: Transaction[];
}

/** Reads everything (including soft-deleted rows) from another scope's database. */
export async function readScope(scope: string): Promise<ScopeSnapshot> {
  const db = scope === activeScope ? await getDB() : await openScope(scope);
  try {
    return { books: await db.getAll("books"), transactions: await db.getAll("transactions") };
  } finally {
    if (scope !== activeScope) db.close();
  }
}

/** Copies records into the active scope and queues them for upload. */
export async function importRecords(snapshot: ScopeSnapshot): Promise<number> {
  let count = 0;
  for (const b of snapshot.books) {
    if (await upsertBookFromRemote(b)) {
      await enqueueSync({ entity: "book", entityId: b.id, op: "put", payload: b });
      count++;
    }
  }
  for (const t of snapshot.transactions) {
    if (await upsertTransactionFromRemote(t)) {
      await enqueueSync({ entity: "transaction", entityId: t.id, op: "put", payload: t });
      count++;
    }
  }
  return count;
}
