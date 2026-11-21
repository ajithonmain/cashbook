import type { Transaction } from "./types";
import { getScope } from "./db";

// Last-known entries per book, so screens paint instantly with real data instead of a skeleton or
// an empty state while IndexedDB is read again. Keyed by scope so accounts never share entries.
const entries = new Map<string, Transaction[]>();

const key = (bookId: string) => `${getScope()}:${bookId}`;

export function getCachedEntries(bookId: string): Transaction[] | undefined {
  return entries.get(key(bookId));
}

export function setCachedEntries(bookId: string, txns: Transaction[]): void {
  entries.set(key(bookId), txns);
}
