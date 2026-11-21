import type { ReactNode } from "react";
import { formatAmount } from "../../lib/format";

interface SummaryCardProps {
  label: ReactNode;
  net: number;
  totalIn: number;
  totalOut: number;
  badge?: ReactNode;
}

export default function SummaryCard({ label, net, totalIn, totalOut, badge }: SummaryCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/10 bg-surface shadow-card">
      <div className="flex items-start justify-between gap-3 px-3.5 pb-2 pt-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-fg-muted">{label}</div>
          <p className={`tabular truncate text-2xl font-bold tracking-tight ${net < 0 ? "text-out" : "text-fg"}`}>
            {formatAmount(net)}
          </p>
        </div>
        {badge}
      </div>
      <div className="grid grid-cols-2 border-t border-border/10">
        <div className="px-3.5 py-2">
          <p className="text-[11px] text-fg-muted">Cash in</p>
          <p className="tabular text-sm font-semibold text-in">{formatAmount(totalIn)}</p>
        </div>
        <div className="border-l border-border/10 px-3.5 py-2">
          <p className="text-[11px] text-fg-muted">Cash out</p>
          <p className="tabular text-sm font-semibold text-out">{formatAmount(totalOut)}</p>
        </div>
      </div>
    </div>
  );
}
