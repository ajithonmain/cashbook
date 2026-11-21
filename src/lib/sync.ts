import {
  getSyncQueue,
  clearSyncQueueItem,
  getMeta,
  setMeta,
  upsertBookFromRemote,
  upsertTransactionFromRemote,
} from "./db";
import type { Book, Transaction, SyncQueueItem } from "./types";

const AUTH_TOKEN_KEY = "cashbook_sync_token";

export function getSyncToken(): string {
  return localStorage.getItem(AUTH_TOKEN_KEY) ?? "";
}

export function setSyncToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getSyncToken();
  return fetch(`/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
}

let syncing = false;

export async function pushQueue(): Promise<{ pushed: number; failed: number }> {
  if (!getSyncToken()) return { pushed: 0, failed: 0 };
  const queue: SyncQueueItem[] = await getSyncQueue();
  let pushed = 0;
  let failed = 0;
  for (const item of queue) {
    try {
      const res = await apiFetch("/sync/push", {
        method: "POST",
        body: JSON.stringify(item),
      });
      if (res.ok) {
        await clearSyncQueueItem(item.id);
        pushed++;
      } else {
        failed++;
      }
    } catch {
      failed++;
      break; // offline — stop and retry later
    }
  }
  return { pushed, failed };
}

export async function pullChanges(): Promise<{ books: number; transactions: number }> {
  if (!getSyncToken()) return { books: 0, transactions: 0 };
  const since = (await getMeta("lastPullAt")) ?? 0;
  const res = await apiFetch(`/sync/pull?since=${since}`);
  if (!res.ok) return { books: 0, transactions: 0 };
  const data = (await res.json()) as { books: Book[]; transactions: Transaction[]; serverTime: number };
  for (const b of data.books) await upsertBookFromRemote(b);
  for (const t of data.transactions) await upsertTransactionFromRemote(t);
  await setMeta("lastPullAt", data.serverTime);
  return { books: data.books.length, transactions: data.transactions.length };
}

export async function runSync(): Promise<void> {
  if (syncing || !navigator.onLine) return;
  syncing = true;
  try {
    await pushQueue();
    await pullChanges();
  } catch {
    // swallow — will retry on next trigger
  } finally {
    syncing = false;
  }
}

export function initSync(): void {
  window.addEventListener("online", () => void runSync());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void runSync();
  });
  void runSync();
  setInterval(() => void runSync(), 60_000);
}
