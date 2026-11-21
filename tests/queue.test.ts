import { describe, expect, it } from "vitest";
import { coalesceQueue } from "../src/lib/queue";
import type { SyncQueueItem } from "../src/lib/types";

function item(id: string, entityId: string, queuedAt: number, entity: "book" | "transaction" = "transaction"): SyncQueueItem {
  return { id, entity, entityId, op: "put", payload: null, queuedAt };
}

describe("coalesceQueue", () => {
  it("keeps only the newest write per record and reports superseded ids", () => {
    const { send, drop } = coalesceQueue([item("q1", "a", 1), item("q2", "a", 2), item("q3", "b", 3), item("q4", "a", 4)]);
    expect(send.map((i) => i.id)).toEqual(["q3", "q4"]);
    expect(drop).toEqual(["q1", "q2"]);
  });

  it("treats a book and a transaction with the same id as different records", () => {
    const { send, drop } = coalesceQueue([item("q1", "x", 1, "book"), item("q2", "x", 2, "transaction")]);
    expect(send).toHaveLength(2);
    expect(drop).toHaveLength(0);
  });

  it("handles an empty queue", () => {
    expect(coalesceQueue([])).toEqual({ send: [], drop: [] });
  });
});
