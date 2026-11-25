import type { Transaction } from "./types";

export interface Totals {
  totalIn: number;
  totalOut: number;
  net: number;
}

export function totalsOf(transactions: Pick<Transaction, "type" | "amount">[]): Totals {
  let totalIn = 0;
  let totalOut = 0;
  for (const t of transactions) {
    if (t.type === "in") totalIn += t.amount;
    else totalOut += t.amount;
  }
  return { totalIn, totalOut, net: totalIn - totalOut };
}
