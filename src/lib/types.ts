export type EntryType = "in" | "out";

/** A user-defined extra field on entries (e.g. "Invoice #"). Id is stable across renames. */
export interface CustomField {
  id: string;
  name: string;
}

/**
 * Per-book entry-field configuration: which fields are shown/required, and the category and
 * payment-mode option lists (order is the picker and filter order). Renaming an item only
 * changes the label shown for new entries; past transactions keep whatever string they stored.
 */
export interface BookSettings {
  categories: string[];
  paymentModes: string[];
  categoryEnabled: boolean;
  categoryRequired: boolean;
  paymentModeEnabled: boolean;
  paymentModeRequired: boolean;
  partyEnabled: boolean;
  partyRequired: boolean;
  customFields: CustomField[];
}

export interface Book {
  id: string;
  name: string;
  /** Key from ICON_KEYS; books created before icons existed have none. */
  icon?: string;
  /** HSL hue 0-359; null or missing means derive from the name. */
  color?: number | null;
  /** Missing means this book uses the legacy global defaults; see lib/bookSettings.ts. */
  settings?: BookSettings;
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
}

export interface Transaction {
  id: string;
  bookId: string;
  type: EntryType;
  amount: number;
  category: string;
  party: string;
  paymentMode: string;
  remarks: string;
  /** Keyed by BookSettings.customFields[].id; missing/omitted entries mean "blank". */
  customFields?: Record<string, string>;
  occurredAt: number;
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
}

export type SyncOp = "put" | "delete";

export interface SyncQueueItem {
  id: string;
  entity: "book" | "transaction";
  entityId: string;
  op: SyncOp;
  payload: Book | Transaction | null;
  queuedAt: number;
}

export const CATEGORIES_IN = ["Salary", "Sales", "Interest", "Refund", "Gift", "Other Income"];
export const CATEGORIES_OUT = ["Food", "Fuel", "Rent", "Shopping", "Utilities", "Travel", "Medical", "Other Expense"];
export const PAYMENT_MODES = ["Cash", "Online", "Card", "Bank Transfer"];
