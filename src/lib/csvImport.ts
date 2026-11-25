import type { BookSettings, Transaction } from "./types";

/** Limits mirror server/lib/validate.ts; a longer value would be rejected on push and stall sync. */
const MAX_CATEGORY = 60;
const MAX_PAYMENT_MODE = 40;
const MAX_PARTY = 120;
const MAX_REMARKS = 500;
const MAX_LIST_ITEMS = 200;
const MAX_AMOUNT = 1e12;

export type ImportEntry = Pick<
  Transaction,
  "type" | "amount" | "category" | "party" | "paymentMode" | "remarks" | "occurredAt"
>;

export interface SkippedRow {
  /** 1-based row number as a spreadsheet shows it (the header is row 1). */
  row: number;
  reason: string;
}

export interface ParsedImport {
  entries: ImportEntry[];
  skipped: SkippedRow[];
}

/** RFC 4180 parser: quoted fields may contain commas, doubled quotes and newlines. */
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quoted) {
      if (c !== '"') field += c;
      else if (source[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && source[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Parses "01 September 2024" with "4:31 pm" as local time. Returns null for anything impossible. */
export function parseDateTime(date: string, time: string): number | null {
  const d = /^(\d{1,2})[\s-]+([A-Za-z]{3,9})[\s-]+(\d{4})$/.exec(date.trim());
  if (!d) return null;
  const day = Number(d[1]);
  const month = MONTHS.indexOf(d[2].slice(0, 3).toLowerCase());
  const year = Number(d[3]);
  if (month < 0 || year < 1970 || year > 2099) return null;

  let hours = 0;
  let minutes = 0;
  if (time.trim()) {
    const t = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap])?\.?(?:m\.?)?$/i.exec(time.trim());
    if (!t) return null;
    hours = Number(t[1]);
    minutes = Number(t[2]);
    const meridiem = t[3]?.toLowerCase();
    if (meridiem) {
      if (hours < 1 || hours > 12) return null;
      hours = (hours % 12) + (meridiem === "p" ? 12 : 0);
    }
    if (hours > 23 || minutes > 59) return null;
  }

  const result = new Date(year, month, day, hours, minutes);
  if (result.getMonth() !== month || result.getDate() !== day) return null;
  return result.getTime();
}

/** Blank means "this column does not apply" (null); unreadable text is NaN. */
function parseAmount(value: string): number | null {
  const cleaned = value.replace(/[,\s]/g, "");
  if (!cleaned) return null;
  return /^-?\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : Number.NaN;
}

/**
 * Reads a CashBook-style export with the columns Date, Time, Remark, Entry by, Category, Mode,
 * Cash In, Cash Out, Balance. Columns are matched by name, so order and extra columns do not matter.
 * Throws when the file is not this kind of export.
 */
export function parseEntriesCsv(text: string): ParsedImport {
  const [header = [], ...body] = parseCsv(text);
  const names = header.map((h) => h.trim().toLowerCase());
  const column = (...aliases: string[]) => names.findIndex((n) => aliases.includes(n));

  const col = {
    date: column("date"),
    time: column("time"),
    remarks: column("remark", "remarks"),
    category: column("category"),
    party: column("party", "party name", "contact"),
    mode: column("mode", "payment mode"),
    cashIn: column("cash in"),
    cashOut: column("cash out"),
  };
  if (col.date < 0 || col.cashIn < 0 || col.cashOut < 0) {
    throw new Error("This file needs Date, Cash In and Cash Out columns.");
  }

  const entries: ImportEntry[] = [];
  const skipped: SkippedRow[] = [];

  body.forEach((cells, index) => {
    if (cells.every((c) => !c.trim())) return;
    const row = index + 2;
    const read = (i: number) => (i >= 0 ? (cells[i] ?? "").trim() : "");
    const skip = (reason: string) => skipped.push({ row, reason });

    const occurredAt = parseDateTime(read(col.date), read(col.time));
    if (occurredAt === null) return skip("Unreadable date or time");

    const cashIn = parseAmount(read(col.cashIn));
    const cashOut = parseAmount(read(col.cashOut));
    if (Number.isNaN(cashIn) || Number.isNaN(cashOut)) return skip("Unreadable amount");
    if (cashIn && cashOut) return skip("Has both Cash In and Cash Out");
    const amount = cashIn || cashOut || 0;
    if (amount === 0) return skip("Amount is zero");
    if (amount < 0 || amount >= MAX_AMOUNT) return skip("Amount is out of range");

    entries.push({
      type: cashIn ? "in" : "out",
      amount,
      category: read(col.category).slice(0, MAX_CATEGORY),
      party: read(col.party).slice(0, MAX_PARTY),
      paymentMode: read(col.mode).slice(0, MAX_PAYMENT_MODE),
      remarks: read(col.remarks).slice(0, MAX_REMARKS),
      occurredAt,
    });
  });

  return { entries, skipped };
}

function entryKey(e: ImportEntry): string {
  return JSON.stringify([e.type, e.amount, e.occurredAt, e.category, e.party, e.paymentMode, e.remarks]);
}

/**
 * Drops rows already in the book, so importing the same file twice adds nothing. Matching is by count:
 * two identical rows in the file still produce two entries when the book has neither.
 */
export function withoutExisting(incoming: ImportEntry[], existing: ImportEntry[]): ImportEntry[] {
  const remaining = new Map<string, number>();
  for (const e of existing) remaining.set(entryKey(e), (remaining.get(entryKey(e)) ?? 0) + 1);
  return incoming.filter((e) => {
    const key = entryKey(e);
    const count = remaining.get(key) ?? 0;
    if (count === 0) return true;
    remaining.set(key, count - 1);
    return false;
  });
}

function appendMissing(list: string[], values: string[]): string[] {
  const seen = new Set(list);
  const next = [...list];
  for (const value of values) {
    if (!value || seen.has(value) || next.length >= MAX_LIST_ITEMS) continue;
    seen.add(value);
    next.push(value);
  }
  return next;
}

/** Adds imported categories and payment modes to the book's pickers. Null when nothing is new. */
export function withImportedOptions(settings: BookSettings, entries: ImportEntry[]): BookSettings | null {
  const categories = appendMissing(
    settings.categories,
    entries.map((e) => e.category)
  );
  const paymentModes = appendMissing(
    settings.paymentModes,
    entries.map((e) => e.paymentMode)
  );
  if (categories.length === settings.categories.length && paymentModes.length === settings.paymentModes.length) return null;
  return { ...settings, categories, paymentModes };
}
