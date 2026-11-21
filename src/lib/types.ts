export type EntryType = "in" | "out";

export interface Book {
  id: string;
  name: string;
  /** Key from ICON_KEYS; books created before icons existed have none. */
  icon?: string;
  /** HSL hue 0-359; null or missing means derive from the name. */
  color?: number | null;
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
