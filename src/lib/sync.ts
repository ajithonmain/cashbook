import { useSyncExternalStore } from "react";
import { api, ApiError } from "./api";
import { getAuth } from "./auth";
import {
  countSyncQueue,
  getMeta,
  getSyncQueue,
  removeSyncItems,
  QUEUED_EVENT,
  setMeta,
  upsertBookFromRemote,
  upsertTransactionFromRemote,
} from "./db";
import { coalesceQueue } from "./queue";
import type { Book, Transaction } from "./types";

export type SyncStatus = "local" | "idle" | "syncing" | "offline" | "error" | "expired";

export interface SyncState {
  status: SyncStatus;
  lastSyncAt: number | null;
  pending: number;
  error: string | null;
}

const PUSH_CHUNK = 100;
const MAX_PULL_PAGES = 200;

let state: SyncState = { status: "local", lastSyncAt: null, pending: 0, error: null };
const listeners = new Set<() => void>();
let running = false;
let rerun = false;

function setState(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useSyncState(): SyncState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

/** Bumped whenever remote changes land locally, so screens know to re-read IndexedDB. */
let dataVersion = 0;
const dataListeners = new Set<() => void>();

export function useDataVersion(): number {
  return useSyncExternalStore(
    (l) => {
      dataListeners.add(l);
      return () => dataListeners.delete(l);
    },
    () => dataVersion,
    () => dataVersion
  );
}

function bumpData() {
  dataVersion++;
  for (const l of dataListeners) l();
}

async function push(): Promise<void> {
  const queue = await getSyncQueue();
  const { send, drop } = coalesceQueue(queue);
  if (drop.length) await removeSyncItems(drop);

  for (let i = 0; i < send.length; i += PUSH_CHUNK) {
    const chunk = send.slice(i, i + PUSH_CHUNK);
    await api("/sync/push", {
      method: "POST",
      body: { items: chunk.map((c) => ({ entity: c.entity, payload: c.payload })) },
    });
    await removeSyncItems(chunk.map((c) => c.id));
  }
}

interface PullResponse {
  books: Book[];
  transactions: Transaction[];
  cursor: number;
  hasMore: boolean;
}

async function pull(): Promise<number> {
  let since = Number((await getMeta("pullCursor")) ?? 0);
  let changed = 0;

  for (let page = 0; page < MAX_PULL_PAGES; page++) {
    const res = await api<PullResponse>(`/sync/pull?since=${since}`);
    for (const b of res.books) if (await upsertBookFromRemote(b)) changed++;
    for (const t of res.transactions) if (await upsertTransactionFromRemote(t)) changed++;

    const stalled = res.cursor <= since && res.hasMore;
    since = Math.max(since, res.cursor);
    await setMeta("pullCursor", since);
    if (!res.hasMore || stalled) break;
  }
  return changed;
}

export async function refreshPending(): Promise<void> {
  setState({ pending: await countSyncQueue() });
}

export async function runSync(): Promise<void> {
  const auth = getAuth();
  if (!auth) {
    setState({ status: "local", error: null });
    return;
  }
  if (auth.expired) {
    setState({ status: "expired" });
    return;
  }
  if (!navigator.onLine) {
    await refreshPending();
    setState({ status: "offline" });
    return;
  }
  if (running) {
    rerun = true;
    return;
  }

  running = true;
  setState({ status: "syncing", error: null });
  try {
    await push();
    const changed = await pull();
    if (changed > 0) bumpData();
    setState({ status: "idle", lastSyncAt: Date.now(), error: null });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) setState({ status: "expired" });
    else if (e instanceof TypeError) setState({ status: "offline" });
    else setState({ status: "error", error: e instanceof Error ? e.message : "Sync failed" });
  } finally {
    running = false;
    await refreshPending();
    if (rerun) {
      rerun = false;
      void runSync();
    }
  }
}

export function resetSyncState(): void {
  setState({ status: getAuth() ? "idle" : "local", lastSyncAt: null, pending: 0, error: null });
}

let started = false;
export function initSync(): void {
  if (started) return;
  started = true;
  let debounce: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener(QUEUED_EVENT, () => {
    void refreshPending();
    clearTimeout(debounce);
    debounce = setTimeout(() => void runSync(), 800);
  });
  window.addEventListener("online", () => void runSync());
  window.addEventListener("offline", () => setState({ status: getAuth() ? "offline" : "local" }));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void runSync();
  });
  setInterval(() => void runSync(), 60_000);
  void runSync();
}
