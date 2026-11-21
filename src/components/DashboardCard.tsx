import { formatAmount } from "../lib/format";

interface DashboardCardProps {
  netBalance: number;
  totalIn: number;
  totalOut: number;
}

export default function DashboardCard({ netBalance, totalIn, totalOut }: DashboardCardProps) {
  return (
    <div className="mx-4 my-3 overflow-hidden rounded-2xl border border-border/10 bg-surface shadow-card">
      <div className="flex items-center justify-between px-4 py-3.5">
        <span className="text-sm font-semibold text-fg-muted">Net Balance</span>
        <span className="tabular text-2xl font-extrabold text-fg">{formatAmount(netBalance)}</span>
      </div>
      <div className="grid grid-cols-2 gap-px border-t border-border/10 bg-border/10">
        <div className="bg-surface px-4 py-3">
          <p className="text-xs font-medium text-fg-muted">Total In (+)</p>
          <p className="tabular text-base font-bold text-in">{formatAmount(totalIn)}</p>
        </div>
        <div className="bg-surface px-4 py-3">
          <p className="text-xs font-medium text-fg-muted">Total Out (-)</p>
          <p className="tabular text-base font-bold text-out">{formatAmount(totalOut)}</p>
        </div>
      </div>
    </div>
  );
}
