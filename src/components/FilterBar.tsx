export interface Filters {
  search: string;
  type: "all" | "in" | "out";
  category: string;
  party: string;
  paymentMode: string;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  categories: string[];
  parties: string[];
  paymentModes: string[];
}

export default function FilterBar({ filters, onChange, categories, parties, paymentModes }: FilterBarProps) {
  return (
    <div className="border-b border-border/10 bg-bg">
      <div className="px-4 pt-3">
        <label htmlFor="txn-search" className="sr-only">
          Search by category or party
        </label>
        <div className="relative">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            id="txn-search"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search by category or party"
            className="w-full rounded-full border border-border/10 bg-surface py-2.5 pl-10 pr-3 text-base text-fg outline-none placeholder:text-fg-muted focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
        </div>
      </div>
      <div className="pill-scroll">
        <label className="sr-only" htmlFor="filter-type">
          Entry Type
        </label>
        <select id="filter-type" value={filters.type} onChange={(e) => onChange({ ...filters, type: e.target.value as Filters["type"] })} className="pill">
          <option value="all">Entry Type</option>
          <option value="in">Cash In</option>
          <option value="out">Cash Out</option>
        </select>
        <label className="sr-only" htmlFor="filter-category">
          Category
        </label>
        <select id="filter-category" value={filters.category} onChange={(e) => onChange({ ...filters, category: e.target.value })} className="pill">
          <option value="">Category</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="filter-party">
          Party
        </label>
        <select id="filter-party" value={filters.party} onChange={(e) => onChange({ ...filters, party: e.target.value })} className="pill">
          <option value="">Party</option>
          {parties.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="filter-mode">
          Payment Mode
        </label>
        <select id="filter-mode" value={filters.paymentMode} onChange={(e) => onChange({ ...filters, paymentMode: e.target.value })} className="pill">
          <option value="">Payment Mode</option>
          {paymentModes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
