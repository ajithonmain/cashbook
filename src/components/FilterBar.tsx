import { useState } from "react";
import Sheet from "./ui/Sheet";

export interface Filters {
  search: string;
  type: "all" | "in" | "out";
  category: string;
  party: string;
  paymentMode: string;
}

export const defaultFilters: Filters = { search: "", type: "all", category: "", party: "", paymentMode: "" };

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  categories: string[];
  parties: string[];
  paymentModes: string[];
}

const selectCls =
  "w-full rounded-xl border border-border/10 bg-surface-2 px-3 py-2.5 text-base text-fg outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";
const labelCls = "mb-1.5 block text-xs font-semibold text-fg-muted";

function activeChips(f: Filters): { key: keyof Filters; label: string }[] {
  const chips: { key: keyof Filters; label: string }[] = [];
  if (f.type !== "all") chips.push({ key: "type", label: f.type === "in" ? "Cash in" : "Cash out" });
  if (f.category) chips.push({ key: "category", label: f.category });
  if (f.party) chips.push({ key: "party", label: f.party });
  if (f.paymentMode) chips.push({ key: "paymentMode", label: f.paymentMode });
  return chips;
}

export default function FilterBar({ filters, onChange, categories, parties, paymentModes }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const chips = activeChips(filters);

  function clear(key: keyof Filters) {
    onChange({ ...filters, [key]: key === "type" ? "all" : "" });
  }

  return (
    <div className="px-4 pb-1 pt-3">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="txn-search" className="sr-only">
            Search by category or party
          </label>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            id="txn-search"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search category or party"
            className="h-10 w-full rounded-xl border border-border/10 bg-surface pl-9 pr-3 text-base text-fg outline-none placeholder:text-fg-muted focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label={chips.length ? `Filters, ${chips.length} active` : "Filters"}
          className="press relative flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-border/10 bg-surface text-fg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 7h10M18 7h2M4 17h2M10 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="7" r="2" stroke="currentColor" strokeWidth="2" />
            <circle cx="8" cy="17" r="2" stroke="currentColor" strokeWidth="2" />
          </svg>
          {chips.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-solid px-1 text-[11px] font-bold text-on-brand">
              {chips.length}
            </span>
          )}
        </button>
      </div>

      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c.key}
              onClick={() => clear(c.key)}
              aria-label={`Remove filter ${c.label}`}
              className="press flex min-h-7 items-center gap-1 rounded-full bg-fg/10 py-0.5 pl-2.5 pr-1.5 text-xs font-medium text-fg"
            >
              {c.label}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {open && (
        <Sheet onClose={() => setOpen(false)}>
          <div className="space-y-4 px-5 pb-6 pt-1">
            <h2 className="text-base font-bold text-fg">Filters</h2>
            <div>
              <label htmlFor="filter-type" className={labelCls}>
                Entry type
              </label>
              <select
                id="filter-type"
                value={filters.type}
                onChange={(e) => onChange({ ...filters, type: e.target.value as Filters["type"] })}
                className={selectCls}
              >
                <option value="all">All</option>
                <option value="in">Cash in</option>
                <option value="out">Cash out</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter-category" className={labelCls}>
                Category
              </label>
              <select id="filter-category" value={filters.category} onChange={(e) => onChange({ ...filters, category: e.target.value })} className={selectCls}>
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-party" className={labelCls}>
                Party
              </label>
              <select id="filter-party" value={filters.party} onChange={(e) => onChange({ ...filters, party: e.target.value })} className={selectCls}>
                <option value="">All</option>
                {parties.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-mode" className={labelCls}>
                Payment mode
              </label>
              <select id="filter-mode" value={filters.paymentMode} onChange={(e) => onChange({ ...filters, paymentMode: e.target.value })} className={selectCls}>
                <option value="">All</option>
                {paymentModes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => onChange({ ...defaultFilters, search: filters.search })}
                className="press flex-1 rounded-xl bg-fg/10 py-2.5 text-sm font-bold text-fg"
              >
                Reset
              </button>
              <button onClick={() => setOpen(false)} className="press flex-1 rounded-xl bg-brand-solid py-2.5 text-sm font-bold text-on-brand">
                Done
              </button>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}
