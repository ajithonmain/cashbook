import { useEffect, useState } from "react";
import type { Book, Transaction } from "../lib/types";
import { listBooks, listTransactions } from "../lib/db";
import { formatAmount } from "../lib/format";
import { useDataVersion } from "../lib/sync";

interface BookSummary extends Book {
  totalIn: number;
  totalOut: number;
  balance: number;
}

export default function Reports() {
  const [summaries, setSummaries] = useState<BookSummary[] | null>(null);
  const dataVersion = useDataVersion();

  useEffect(() => {
    void (async () => {
      const books = await listBooks();
      const withTotals = await Promise.all(
        books.map(async (b) => {
          const txns: Transaction[] = await listTransactions(b.id);
          const totalIn = txns.filter((t) => t.type === "in").reduce((s, t) => s + t.amount, 0);
          const totalOut = txns.filter((t) => t.type === "out").reduce((s, t) => s + t.amount, 0);
          return { ...b, totalIn, totalOut, balance: totalIn - totalOut };
        })
      );
      setSummaries(withTotals);
    })();
  }, [dataVersion]);

  const grandIn = summaries?.reduce((s, b) => s + b.totalIn, 0) ?? 0;
  const grandOut = summaries?.reduce((s, b) => s + b.totalOut, 0) ?? 0;

  return (
    <div className="min-h-dvh bg-bg pb-28">
      <div className="safe-top px-4 pb-2 pt-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg">Reports</h1>
        <p className="text-sm text-fg-muted">Across all your books</p>
      </div>

      <div className="mx-4 mb-4 overflow-hidden rounded-2xl border border-border/10 bg-surface shadow-card">
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm font-semibold text-fg-muted">Combined Net Balance</span>
          <span className="tabular text-2xl font-extrabold text-fg">{formatAmount(grandIn - grandOut)}</span>
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-border/10 bg-border/10">
          <div className="bg-surface px-4 py-3">
            <p className="text-xs font-medium text-fg-muted">Total In (+)</p>
            <p className="tabular text-base font-bold text-in">{formatAmount(grandIn)}</p>
          </div>
          <div className="bg-surface px-4 py-3">
            <p className="text-xs font-medium text-fg-muted">Total Out (-)</p>
            <p className="tabular text-base font-bold text-out">{formatAmount(grandOut)}</p>
          </div>
        </div>
      </div>

      <div className="px-4">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-fg-muted">By Book</h2>
        <div className="divide-y divide-border/10 overflow-hidden rounded-2xl border border-border/10 bg-surface shadow-card">
          {summaries === null && <p className="px-4 py-8 text-center text-sm text-fg-muted">Loading...</p>}
          {summaries?.length === 0 && <p className="px-4 py-8 text-center text-sm text-fg-muted">No books yet.</p>}
          {summaries?.map((b) => (
            <div key={b.id} className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="font-semibold text-fg">{b.name}</p>
                <p className="text-xs text-fg-muted">
                  In {formatAmount(b.totalIn)} &middot; Out {formatAmount(b.totalOut)}
                </p>
              </div>
              <span className={`tabular text-sm font-bold ${b.balance >= 0 ? "text-in" : "text-out"}`}>
                {formatAmount(b.balance)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
