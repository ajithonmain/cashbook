import type { SyncQueueItem } from "./types";

/** Keep only the newest queued write per record; older ones are superseded. */
export function coalesceQueue(queue: SyncQueueItem[]): { send: SyncQueueItem[]; drop: string[] } {
  const latest = new Map<string, SyncQueueItem>();
  for (const item of queue) latest.set(`${item.entity}:${item.entityId}`, item);
  const keep = new Set(Array.from(latest.values(), (i) => i.id));
  return {
    send: queue.filter((i) => keep.has(i.id)),
    drop: queue.filter((i) => !keep.has(i.id)).map((i) => i.id),
  };
}
