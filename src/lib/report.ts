import type { Transaction } from "./types";
import { dateKey, formatDateHeading } from "./format";

export interface SummaryRow {
  label: string;
  totalIn: number;
  totalOut: number;
}

function summarize(transactions: Transaction[], keyOf: (t: Transaction) => string, labelOf: (key: string) => string): SummaryRow[] {
  const byKey = new Map<string, SummaryRow>();
  for (const t of transactions) {
    const key = keyOf(t);
    const row = byKey.get(key) ?? { label: labelOf(key), totalIn: 0, totalOut: 0 };
    if (t.type === "in") row.totalIn += t.amount;
    else row.totalOut += t.amount;
    byKey.set(key, row);
  }
  return Array.from(byKey.values());
}

function summarizeByDay(transactions: Transaction[]): SummaryRow[] {
  const byDay = new Map<string, { ts: number; totalIn: number; totalOut: number }>();
  for (const t of transactions) {
    const key = dateKey(t.occurredAt);
    const row = byDay.get(key) ?? { ts: t.occurredAt, totalIn: 0, totalOut: 0 };
    if (t.type === "in") row.totalIn += t.amount;
    else row.totalOut += t.amount;
    byDay.set(key, row);
  }
  return Array.from(byDay.values())
    .sort((a, b) => b.ts - a.ts)
    .map((r) => ({ label: formatDateHeading(r.ts), totalIn: r.totalIn, totalOut: r.totalOut }));
}

export function categoryWiseSummary(transactions: Transaction[]): SummaryRow[] {
  return summarize(
    transactions,
    (t) => t.category || "No category",
    (k) => k
  ).sort((a, b) => b.totalIn + b.totalOut - (a.totalIn + a.totalOut));
}

export function paymentModeWiseSummary(transactions: Transaction[]): SummaryRow[] {
  return summarize(
    transactions,
    (t) => t.paymentMode || "No payment mode",
    (k) => k
  ).sort((a, b) => b.totalIn + b.totalOut - (a.totalIn + a.totalOut));
}

export function partyWiseSummary(transactions: Transaction[]): SummaryRow[] {
  return summarize(
    transactions,
    (t) => t.party || "No party",
    (k) => k
  ).sort((a, b) => b.totalIn + b.totalOut - (a.totalIn + a.totalOut));
}

export type ReportType = "all" | "dayWise" | "categoryWise" | "paymentModeWise" | "partyWise";

export const REPORT_TYPES: { key: ReportType; title: string; description: string }[] = [
  { key: "all", title: "All Entries Report", description: "List of all entries and details" },
  { key: "dayWise", title: "Day-wise summary", description: "Day-wise total in, out & balance" },
  { key: "partyWise", title: "Party-wise summary", description: "Party-wise total in, out & balance" },
  { key: "categoryWise", title: "Category-wise summary", description: "Income & expenses of all categories" },
  { key: "paymentModeWise", title: "Payment Modes summary", description: "Income & expenses by all payment modes" },
];

export function summaryFor(type: ReportType, transactions: Transaction[]): SummaryRow[] {
  switch (type) {
    case "dayWise":
      return summarizeByDay(transactions);
    case "categoryWise":
      return categoryWiseSummary(transactions);
    case "paymentModeWise":
      return paymentModeWiseSummary(transactions);
    case "partyWise":
      return partyWiseSummary(transactions);
    default:
      return [];
  }
}
