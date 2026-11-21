import { useEffect, useState } from "react";
import type { Book, Transaction } from "../lib/types";
import { listBooks, listTransactions } from "../lib/db";
import { formatAmount } from "../lib/format";
import { useDataVersion } from "../lib/sync";
import BookAvatar from "./BookAvatar";
import SummaryCard from "./ui/SummaryCard";

interface BookSummary extends Book {
  totalIn: number;
  totalOut: number;
}

export default function Reports() {
  const [summaries, setSummaries] = useState<BookSummary[] | null>(null);
  const dataVersion = useDataVersion();

  useEffect(() => {
    void (async () => {
      const books = await listBooks();
      setSummaries(
        await Promise.all(
          books.map(async (b) => {
            const txns: Transaction[] = await listTransactions(b.id);
            return {
              ...b,
              totalIn: txns.filter((t) => t.type === "in").reduce((s, t) => s + t.amount, 0),
              totalOut: txns.filter((t) => t.type === "out").reduce((s, t) => s + t.amount, 0),
            };
          })
        )
      );
    })();
  }, [dataVersion]);

  const grandIn = summaries?.reduce((s, b) => s + b.totalIn, 0) ?? 0;
  const grandOut = summaries?.reduce((s, b) => s + b.totalOut, 0) ?? 0;

  return (
    <div className="min-h-dvh bg-bg px-4 pb-20 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <SummaryCard label="All books" net={grandIn - grandOut} totalIn={grandIn} totalOut={grandOut} />

      <h2 className="mb-1.5 mt-4 px-1 text-[11px] font-bold uppercase tracking-wider text-fg-muted">By book</h2>
      <div className="divide-y divide-border/10 overflow-hidden rounded-2xl border border-border/10 bg-surface shadow-card">
        {summaries === null && <div className="skeleton m-4 h-10 rounded-xl" />}
        {summaries?.length === 0 && <p className="px-4 py-8 text-center text-sm text-fg-muted">No books yet.</p>}
        {summaries?.map((b) => {
          const balance = b.totalIn - b.totalOut;
          return (
            <div key={b.id} className="px-3.5 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <BookAvatar book={b} size={22} />
                  <span className="truncate text-sm font-semibold text-fg">{b.name}</span>
                </span>
                <span className={`tabular text-sm font-bold ${balance < 0 ? "text-out" : "text-fg"}`}>{formatAmount(balance)}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-fg-muted">
                <span className="text-in">{formatAmount(b.totalIn)} in</span> &middot;{" "}
                <span className="text-out">{formatAmount(b.totalOut)} out</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
