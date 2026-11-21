import { pbkdf2Sync, randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  DUMMY_HASH,
  hashPassword,
  randomToken,
  safeEqualStrings,
  sha256Hex,
  verifyPassword,
} from "../server/lib/crypto";

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash.startsWith("pbkdf2-sha256$100000$")).toBe(true);
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("salts every hash", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });

  it("rejects malformed stored hashes instead of throwing", async () => {
    expect(await verifyPassword("x", "garbage")).toBe(false);
    expect(await verifyPassword("x", "md5$1$aa$bb")).toBe(false);
  });

  it("DUMMY_HASH is well formed and never matches", async () => {
    expect(await verifyPassword("", DUMMY_HASH)).toBe(false);
    expect(await verifyPassword("anything", DUMMY_HASH)).toBe(false);
  });
});

describe("admin CLI compatibility", () => {
  it("accepts hashes produced by scripts/admin.mjs (node:crypto pbkdf2Sync)", async () => {
    const salt = randomBytes(16);
    const hash = pbkdf2Sync("temp-password-1", salt, 100_000, 32, "sha256");
    const stored = `pbkdf2-sha256$100000$${salt.toString("base64")}$${hash.toString("base64")}`;
    expect(await verifyPassword("temp-password-1", stored)).toBe(true);
    expect(await verifyPassword("temp-password-2", stored)).toBe(false);
  });
});

describe("tokens and comparison", () => {
  it("generates unique url-safe tokens", () => {
    const a = randomToken();
    const b = randomToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("hashes to a stable sha-256 hex digest", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("compares strings of different length safely", async () => {
    expect(await safeEqualStrings("abc", "abc")).toBe(true);
    expect(await safeEqualStrings("abc", "abcd")).toBe(false);
    expect(await safeEqualStrings("", "x")).toBe(false);
  });
});
