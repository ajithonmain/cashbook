import { HttpError } from "./http";

export interface BookRecord {
  id: string;
  name: string;
  icon: string;
  color: number | null;
  /** Opaque to the server: stored and returned as-is, validated only for shape and size. */
  settings: unknown;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}

export interface TransactionRecord {
  id: string;
  bookId: string;
  type: "in" | "out";
  amount: number;
  category: string;
  party: string;
  paymentMode: string;
  remarks: string;
  customFields: unknown;
  occurredAt: number;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}

export type SyncItem =
  | { entity: "book"; payload: BookRecord }
  | { entity: "transaction"; payload: TransactionRecord };

export const MAX_SYNC_ITEMS = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TIMESTAMP = 4_102_444_800_000; // year 2100

function bad(msg: string): never {
  throw new HttpError(400, msg);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown, field: string, max: number, { allowEmpty = false } = {}): string {
  if (typeof v !== "string") bad(`${field} must be a string`);
  if (!allowEmpty && v.length === 0) bad(`${field} is required`);
  if (v.length > max) bad(`${field} is too long`);
  return v;
}

function timestamp(v: unknown, field: string): number {
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > MAX_TIMESTAMP) bad(`${field} is invalid`);
  return v;
}

export function validateEmail(v: unknown): string {
  const email = str(v, "email", 254).trim().toLowerCase();
  if (!EMAIL_RE.test(email)) bad("Enter a valid email address");
  return email;
}

export function validatePassword(v: unknown): string {
  if (typeof v !== "string") bad("password must be a string");
  if (v.length < 8) bad("Password must be at least 8 characters");
  if (v.length > 128) bad("Password is too long");
  return v;
}

export function validateDeviceName(v: unknown): string {
  if (v === undefined || v === null) return "";
  return str(v, "deviceName", 80, { allowEmpty: true }).trim();
}

function bookIcon(v: unknown): string {
  if (v === undefined || v === null) return "book";
  const icon = str(v, "book.icon", 24);
  if (!/^[a-z0-9-]+$/.test(icon)) bad("book.icon is invalid");
  return icon;
}

function bookColor(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 359) bad("book.color must be a hue from 0 to 359");
  return v;
}

const MAX_SETTINGS_JSON = 20_000;
const MAX_LIST_ITEMS = 200;

function stringArray(v: unknown, field: string): string[] {
  if (!Array.isArray(v)) bad(`${field} must be an array`);
  if (v.length > MAX_LIST_ITEMS) bad(`${field} has too many items`);
  return v.map((item) => str(item, `${field}[]`, 60));
}

function customFieldList(v: unknown): { id: string; name: string }[] {
  if (!Array.isArray(v)) bad("settings.customFields must be an array");
  if (v.length > MAX_LIST_ITEMS) bad("settings.customFields has too many items");
  return v.map((item) => {
    if (!isObject(item)) bad("settings.customFields[] must be an object");
    return { id: str(item.id, "settings.customFields[].id", 64), name: str(item.name, "settings.customFields[].name", 60) };
  });
}

function bool(v: unknown, field: string): boolean {
  if (typeof v !== "boolean") bad(`${field} must be a boolean`);
  return v;
}

/** Stored and returned opaque to the server; still shape-checked so a bad client can't poison sync for others. */
function bookSettings(v: unknown): unknown {
  if (v === undefined || v === null) return null;
  if (!isObject(v)) bad("book.settings must be an object");
  if (JSON.stringify(v).length > MAX_SETTINGS_JSON) bad("book.settings is too large");
  return {
    categories: stringArray(v.categories, "settings.categories"),
    paymentModes: stringArray(v.paymentModes, "settings.paymentModes"),
    categoryEnabled: bool(v.categoryEnabled, "settings.categoryEnabled"),
    categoryRequired: bool(v.categoryRequired, "settings.categoryRequired"),
    paymentModeEnabled: bool(v.paymentModeEnabled, "settings.paymentModeEnabled"),
    paymentModeRequired: bool(v.paymentModeRequired, "settings.paymentModeRequired"),
    partyEnabled: bool(v.partyEnabled, "settings.partyEnabled"),
    partyRequired: bool(v.partyRequired, "settings.partyRequired"),
    customFields: customFieldList(v.customFields),
  };
}

function transactionCustomFields(v: unknown): unknown {
  if (v === undefined || v === null) return null;
  if (!isObject(v)) bad("transaction.customFields must be an object");
  if (JSON.stringify(v).length > MAX_SETTINGS_JSON) bad("transaction.customFields is too large");
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(v)) {
    out[str(key, "transaction.customFields key", 64)] = str(val, "transaction.customFields value", 500, { allowEmpty: true });
  }
  return out;
}

export function validateBook(v: unknown): BookRecord {
  if (!isObject(v)) bad("book payload must be an object");
  return {
    id: str(v.id, "book.id", 64),
    name: str(v.name, "book.name", 100),
    icon: bookIcon(v.icon),
    color: bookColor(v.color),
    settings: bookSettings(v.settings),
    createdAt: timestamp(v.createdAt, "book.createdAt"),
    updatedAt: timestamp(v.updatedAt, "book.updatedAt"),
    deleted: v.deleted === true,
  };
}

export function validateTransaction(v: unknown): TransactionRecord {
  if (!isObject(v)) bad("transaction payload must be an object");
  if (v.type !== "in" && v.type !== "out") bad("transaction.type must be 'in' or 'out'");
  const amount = v.amount;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || amount >= 1e12) {
    bad("transaction.amount must be a positive number");
  }
  return {
    id: str(v.id, "transaction.id", 64),
    bookId: str(v.bookId, "transaction.bookId", 64),
    type: v.type,
    amount,
    category: str(v.category, "transaction.category", 60),
    party: str(v.party ?? "", "transaction.party", 120, { allowEmpty: true }),
    paymentMode: str(v.paymentMode ?? "", "transaction.paymentMode", 40, { allowEmpty: true }),
    remarks: str(v.remarks ?? "", "transaction.remarks", 500, { allowEmpty: true }),
    customFields: transactionCustomFields(v.customFields),
    occurredAt: timestamp(v.occurredAt, "transaction.occurredAt"),
    createdAt: timestamp(v.createdAt, "transaction.createdAt"),
    updatedAt: timestamp(v.updatedAt, "transaction.updatedAt"),
    deleted: v.deleted === true,
  };
}

export function validateSyncItems(body: unknown): SyncItem[] {
  if (!isObject(body) || !Array.isArray(body.items)) bad("items must be an array");
  if (body.items.length > MAX_SYNC_ITEMS) bad(`at most ${MAX_SYNC_ITEMS} items per request`);
  return body.items.map((item): SyncItem => {
    if (!isObject(item)) bad("each item must be an object");
    if (item.entity === "book") return { entity: "book", payload: validateBook(item.payload) };
    if (item.entity === "transaction") return { entity: "transaction", payload: validateTransaction(item.payload) };
    return bad("unknown entity");
  });
}
