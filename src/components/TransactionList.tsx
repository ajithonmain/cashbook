import type { Transaction } from "../lib/types";
import { formatAmount, formatDateHeading, formatTime, dateKey } from "../lib/format";
import SwipeRow from "./ui/SwipeRow";

interface TransactionListProps {
  transactions: Transaction[];
  runningBalanceEnd: number;
  onSelect: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}

interface Group {
  key: string;
  heading: string;
  items: { txn: Transaction; balance: number }[];
}

export default function TransactionList({ transactions, runningBalanceEnd, onSelect, onDelete }: TransactionListProps) {
  const sorted = transactions.slice().sort((a, b) => b.occurredAt - a.occurredAt || b.createdAt - a.createdAt);

  let running = runningBalanceEnd;
  const withBalance = sorted.map((txn) => {
    const entry = { txn, balance: running };
    running -= txn.type === "in" ? txn.amount : -txn.amount;
    return entry;
  });

  const groups: Group[] = [];
  for (const entry of withBalance) {
    const key = dateKey(entry.txn.occurredAt);
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, heading: formatDateHeading(entry.txn.occurredAt), items: [] };
      groups.push(group);
    }
    group.items.push(entry);
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center px-8 py-16 text-center">
        <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand/15 text-brand">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <p className="font-bold text-fg">No entries yet</p>
        <p className="mt-1 text-sm text-fg-muted">Tap Cash In or Cash Out below to record your first entry.</p>
      </div>
    );
  }

  return (
    <div>
      {groups.map((group) => (
        <section key={group.key}>
          <h3 className="px-4 pb-1.5 pt-3 text-xs font-bold uppercase tracking-wider text-fg-muted">{group.heading}</h3>
          <div className="divide-y divide-border/10 border-y border-border/10 bg-surface">
            {group.items.map(({ txn, balance }) => (
              <SwipeRow key={txn.id} onDelete={() => onDelete(txn)}>
                <button
                  onClick={() => onSelect(txn)}
                  className="flex w-full flex-col gap-1.5 px-4 py-3.5 text-left active:bg-white/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-1 flex-wrap gap-1.5">
                      <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-semibold text-brand">
                        {txn.category}
                      </span>
                      <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-fg-muted">
                        {txn.paymentMode}
                      </span>
                    </div>
                    <div className="flex-none text-right">
                      <p className={`tabular text-base font-extrabold ${txn.type === "in" ? "text-in" : "text-out"}`}>
                        {txn.type === "in" ? "+" : "-"}
                        {formatAmount(txn.amount)}
                      </p>
                      <p className="tabular text-[11px] text-fg-muted">Bal {formatAmount(balance)}</p>
                    </div>
                  </div>
                  {(txn.party || txn.remarks) && (
                    <p className="truncate text-sm text-fg">
                      {[txn.party, txn.remarks].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <p className="text-xs text-fg-muted">{formatTime(txn.occurredAt)}</p>
                </button>
              </SwipeRow>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
