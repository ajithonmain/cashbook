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
      <div className="px-8 py-14 text-center">
        <p className="text-sm font-semibold text-fg">No entries yet</p>
        <p className="mt-1 text-xs text-fg-muted">Tap Cash in or Cash out to add one.</p>
      </div>
    );
  }

  return (
    <div>
      {groups.map((group) => (
        <section key={group.key}>
          <h3 className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">{group.heading}</h3>
          <div className="divide-y divide-border/10 border-y border-border/10 bg-surface">
            {group.items.map(({ txn, balance }) => (
              <SwipeRow key={txn.id} onDelete={() => onDelete(txn)}>
                <button onClick={() => onSelect(txn)} className="block w-full px-4 py-2 text-left active:bg-fg/5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate text-sm text-fg">
                      <span className="font-semibold">{txn.category}</span>
                      {(txn.party || txn.remarks) && (
                        <span className="text-fg-muted"> · {[txn.party, txn.remarks].filter(Boolean).join(" · ")}</span>
                      )}
                    </p>
                    <p className={`tabular flex-none text-sm font-bold ${txn.type === "in" ? "text-in" : "text-out"}`}>
                      {txn.type === "in" ? "+" : "-"}
                      {formatAmount(txn.amount)}
                    </p>
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between gap-3 text-[11px] text-fg-muted">
                    <span>
                      {formatTime(txn.occurredAt)} · {txn.paymentMode}
                    </span>
                    <span className="tabular">Bal {formatAmount(balance)}</span>
                  </div>
                </button>
              </SwipeRow>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
