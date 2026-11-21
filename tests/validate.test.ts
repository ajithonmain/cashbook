import { describe, expect, it } from "vitest";
import { HttpError } from "../server/lib/http";
import {
  MAX_SYNC_ITEMS,
  validateEmail,
  validatePassword,
  validateSyncItems,
  validateTransaction,
} from "../server/lib/validate";

const txn = {
  id: "t1",
  bookId: "b1",
  type: "in",
  amount: 100,
  category: "Salary",
  party: "Acme",
  paymentMode: "Cash",
  remarks: "",
  occurredAt: 1_700_000_000_000,
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
};

function status(fn: () => unknown): number | null {
  try {
    fn();
    return null;
  } catch (e) {
    return e instanceof HttpError ? e.status : -1;
  }
}

describe("account fields", () => {
  it("normalizes email", () => {
    expect(validateEmail("  Me@Example.COM ")).toBe("me@example.com");
  });
  it("rejects bad emails and short passwords with 400", () => {
    expect(status(() => validateEmail("nope"))).toBe(400);
    expect(status(() => validatePassword("short"))).toBe(400);
    expect(status(() => validatePassword("x".repeat(129)))).toBe(400);
    expect(status(() => validatePassword("long enough password"))).toBeNull();
  });
});

describe("transaction validation", () => {
  it("accepts a valid transaction and defaults optional text", () => {
    const out = validateTransaction({ ...txn, party: undefined, remarks: undefined });
    expect(out.party).toBe("");
    expect(out.deleted).toBe(false);
  });
  it("rejects non-positive, non-finite and huge amounts", () => {
    for (const amount of [0, -5, Number.NaN, Infinity, 1e12, "100"]) {
      expect(status(() => validateTransaction({ ...txn, amount }))).toBe(400);
    }
  });
  it("rejects unknown type and out-of-range timestamps", () => {
    expect(status(() => validateTransaction({ ...txn, type: "transfer" }))).toBe(400);
    expect(status(() => validateTransaction({ ...txn, occurredAt: -1 }))).toBe(400);
    expect(status(() => validateTransaction({ ...txn, updatedAt: 1.5 }))).toBe(400);
  });
  it("rejects oversized text", () => {
    expect(status(() => validateTransaction({ ...txn, remarks: "x".repeat(501) }))).toBe(400);
  });
});

describe("sync batch validation", () => {
  it("accepts mixed entities", () => {
    const items = validateSyncItems({
      items: [
        { entity: "book", payload: { id: "b1", name: "Personal", createdAt: 1, updatedAt: 2 } },
        { entity: "transaction", payload: txn },
      ],
    });
    expect(items).toHaveLength(2);
  });
  it("rejects unknown entities, non-arrays and oversized batches", () => {
    expect(status(() => validateSyncItems({ items: [{ entity: "user", payload: {} }] }))).toBe(400);
    expect(status(() => validateSyncItems({ items: "nope" }))).toBe(400);
    expect(status(() => validateSyncItems({ items: new Array(MAX_SYNC_ITEMS + 1).fill({}) }))).toBe(400);
  });
});
