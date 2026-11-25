import { useMemo, useState } from "react";
import Sheet from "./ui/Sheet";
import DateField from "./ui/DateField";
import { startOfDay } from "../lib/calendar";

export type DatePreset = "all" | "today" | "yesterday" | "thisMonth" | "lastMonth" | "singleDay" | "range";

export interface DateFilter {
  preset: DatePreset;
  /** Start-of-day ms, used by "singleDay". */
  day?: number;
  /** Start-of-day ms, used by "range". */
  start?: number;
  /** Start-of-day ms (inclusive day), used by "range". */
  end?: number;
}

export interface Filters {
  search: string;
  type: "all" | "in" | "out";
  categories: string[];
  parties: string[];
  paymentModes: string[];
  date: DateFilter;
}

export const defaultFilters: Filters = {
  search: "",
  type: "all",
  categories: [],
  parties: [],
  paymentModes: [],
  date: { preset: "all" },
};

function endOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/** Returns an inclusive [start, end] ms range, or null when the filter doesn't narrow by date. */
export function dateRangeFor(date: DateFilter, now = Date.now()): [number, number] | null {
  switch (date.preset) {
    case "all":
      return null;
    case "today":
      return [startOfDay(now), endOfDay(now)];
    case "yesterday": {
      const y = now - 24 * 60 * 60 * 1000;
      return [startOfDay(y), endOfDay(y)];
    }
    case "thisMonth": {
      const d = new Date(now);
      return [new Date(d.getFullYear(), d.getMonth(), 1).getTime(), endOfDay(now)];
    }
    case "lastMonth": {
      const d = new Date(now);
      const start = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const end = new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999);
      return [start.getTime(), end.getTime()];
    }
    case "singleDay":
      return date.day ? [startOfDay(date.day), endOfDay(date.day)] : null;
    case "range":
      return date.start && date.end ? [startOfDay(date.start), endOfDay(date.end)] : null;
    default:
      return null;
  }
}

export const DATE_LABELS: Record<DatePreset, string> = {
  all: "All Time",
  today: "Today",
  yesterday: "Yesterday",
  thisMonth: "This Month",
  lastMonth: "Last Month",
  singleDay: "Single Day",
  range: "Date Range",
};

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  categories: string[];
  parties: string[];
  paymentModes: string[];
}

export const selectCls =
  "w-full rounded-xl border border-border/10 bg-surface-2 px-3 py-2.5 text-base text-fg outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";
export const labelCls = "mb-1.5 block text-xs font-semibold text-fg-muted";

function activeChips(f: Filters): { key: string; label: string; clear: (f: Filters) => Filters }[] {
  const chips: { key: string; label: string; clear: (f: Filters) => Filters }[] = [];
  if (f.type !== "all") chips.push({ key: "type", label: f.type === "in" ? "Cash in" : "Cash out", clear: (x) => ({ ...x, type: "all" }) });
  if (f.date.preset !== "all") chips.push({ key: "date", label: DATE_LABELS[f.date.preset], clear: (x) => ({ ...x, date: { preset: "all" } }) });
  if (f.categories.length) {
    chips.push({
      key: "categories",
      label: f.categories.length === 1 ? f.categories[0] : `${f.categories.length} categories`,
      clear: (x) => ({ ...x, categories: [] }),
    });
  }
  if (f.parties.length) {
    chips.push({
      key: "parties",
      label: f.parties.length === 1 ? f.parties[0] : `${f.parties.length} parties`,
      clear: (x) => ({ ...x, parties: [] }),
    });
  }
  if (f.paymentModes.length) {
    chips.push({
      key: "paymentModes",
      label: f.paymentModes.length === 1 ? f.paymentModes[0] : `${f.paymentModes.length} payment modes`,
      clear: (x) => ({ ...x, paymentModes: [] }),
    });
  }
  return chips;
}

export function CheckboxList({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => options.filter((o) => o.toLowerCase().includes(query.toLowerCase())),
    [options, query]
  );

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  if (options.length === 0) return null;

  return (
    <div>
      <label className={labelCls}>{label}</label>
      {options.length > 6 && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${label.toLowerCase()}`}
          className={`${selectCls} mb-2`}
        />
      )}
      <div className="max-h-48 space-y-0.5 overflow-y-auto rounded-xl border border-border/10 bg-surface-2 p-1">
        {filtered.map((o) => (
          <label key={o} className="press flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-sm text-fg">
            <input
              type="checkbox"
              checked={selected.includes(o)}
              onChange={() => toggle(o)}
              className="h-4 w-4 flex-none accent-brand"
            />
            <span className="truncate">{o}</span>
          </label>
        ))}
        {filtered.length === 0 && <p className="px-2 py-2 text-xs text-fg-muted">No matches</p>}
      </div>
    </div>
  );
}

export default function FilterBar({ filters, onChange, categories, parties, paymentModes }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Filters | null>(null);
  const chips = activeChips(filters);
  const working = draft ?? filters;

  function openSheet() {
    setDraft(filters);
    setOpen(true);
  }

  function apply() {
    if (draft) onChange(draft);
    setOpen(false);
  }

  return (
    <div className="px-4 pb-1 pt-3">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="txn-search" className="sr-only">
            Search by remark or amount
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
            placeholder="Search by remark or amount"
            className="h-10 w-full rounded-xl border border-border/10 bg-surface pl-9 pr-3 text-base text-fg outline-none placeholder:text-fg-muted focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
        </div>
        <button
          onClick={openSheet}
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
              onClick={() => onChange(c.clear(filters))}
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
                value={working.type}
                onChange={(e) => setDraft({ ...working, type: e.target.value as Filters["type"] })}
                className={selectCls}
              >
                <option value="all">All</option>
                <option value="in">Cash in</option>
                <option value="out">Cash out</option>
              </select>
            </div>

            <div>
              <label htmlFor="filter-date" className={labelCls}>
                Date
              </label>
              <select
                id="filter-date"
                value={working.date.preset}
                onChange={(e) => setDraft({ ...working, date: { preset: e.target.value as DatePreset } })}
                className={selectCls}
              >
                {(Object.keys(DATE_LABELS) as DatePreset[]).map((p) => (
                  <option key={p} value={p}>
                    {DATE_LABELS[p]}
                  </option>
                ))}
              </select>
              {working.date.preset === "singleDay" && (
                <div className="mt-2">
                  <DateField
                    id="filter-day"
                    label="Day"
                    value={working.date.day}
                    onChange={(day) => setDraft({ ...working, date: { preset: "singleDay", day } })}
                    className={selectCls}
                  />
                </div>
              )}
              {working.date.preset === "range" && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="filter-start" className={labelCls}>
                      Start date
                    </label>
                    <DateField
                      id="filter-start"
                      label="Start date"
                      value={working.date.start}
                      onChange={(start) => setDraft({ ...working, date: { ...working.date, start } })}
                      className={selectCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="filter-end" className={labelCls}>
                      End date
                    </label>
                    <DateField
                      id="filter-end"
                      label="End date"
                      value={working.date.end}
                      onChange={(end) => setDraft({ ...working, date: { ...working.date, end } })}
                      className={selectCls}
                    />
                  </div>
                </div>
              )}
            </div>

            <CheckboxList
              label="Category"
              options={categories}
              selected={working.categories}
              onChange={(categories) => setDraft({ ...working, categories })}
            />
            <CheckboxList
              label="Payment mode"
              options={paymentModes}
              selected={working.paymentModes}
              onChange={(paymentModes) => setDraft({ ...working, paymentModes })}
            />
            <CheckboxList
              label="Party"
              options={parties}
              selected={working.parties}
              onChange={(parties) => setDraft({ ...working, parties })}
            />

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setDraft({ ...defaultFilters, search: filters.search })}
                className="press flex-1 rounded-xl bg-fg/10 py-2.5 text-sm font-bold text-fg"
              >
                Clear
              </button>
              <button onClick={apply} className="press flex-1 rounded-xl bg-brand-solid py-2.5 text-sm font-bold text-on-brand">
                Apply
              </button>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}
