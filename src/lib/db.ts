import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Book, Transaction, SyncQueueItem } from "./types";

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

let dbPromise: Promise<IDBPDatabase<CashBookDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<CashBookDB>("cashbook", 1, {
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
  return dbPromise;
}

function uid() {
  return crypto.randomUUID();
}

async function enqueueSync(item: Omit<SyncQueueItem, "id" | "queuedAt">) {
  const db = await getDB();
  await db.put("syncQueue", { ...item, id: uid(), queuedAt: Date.now() });
}

export async function listBooks(): Promise<Book[]> {
  const db = await getDB();
  const all = await db.getAll("books");
  return all.filter((b) => !b.deleted).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function createBook(name: string): Promise<Book> {
  const db = await getDB();
  const now = Date.now();
  const book: Book = { id: uid(), name, createdAt: now, updatedAt: now };
  await db.put("books", book);
  await enqueueSync({ entity: "book", entityId: book.id, op: "put", payload: book });
  return book;
}

export async function renameBook(id: string, name: string): Promise<void> {
  const db = await getDB();
  const book = await db.get("books", id);
  if (!book) return;
  const updated = { ...book, name, updatedAt: Date.now() };
  await db.put("books", updated);
  await enqueueSync({ entity: "book", entityId: id, op: "put", payload: updated });
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDB();
  const book = await db.get("books", id);
  if (!book) return;
  const updated = { ...book, deleted: true, updatedAt: Date.now() };
  await db.put("books", updated);
  await enqueueSync({ entity: "book", entityId: id, op: "delete", payload: updated });
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
  await db.put("books", {
    ...(await db.get("books", input.bookId))!,
    updatedAt: now,
  });
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
  return db.getAll("syncQueue");
}

export async function clearSyncQueueItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("syncQueue", id);
}

export async function getMeta(key: string): Promise<string | number | undefined> {
  const db = await getDB();
  return db.get("meta", key);
}

export async function setMeta(key: string, value: string | number): Promise<void> {
  const db = await getDB();
  await db.put("meta", value, key);
}

export async function upsertBookFromRemote(book: Book): Promise<void> {
  const db = await getDB();
  const local = await db.get("books", book.id);
  if (!local || local.updatedAt < book.updatedAt) {
    await db.put("books", book);
  }
}

export async function upsertTransactionFromRemote(txn: Transaction): Promise<void> {
  const db = await getDB();
  const local = await db.get("transactions", txn.id);
  if (!local || local.updatedAt < txn.updatedAt) {
    await db.put("transactions", txn);
  }
}
