import { useMemo, useState } from "react";
import type { Book, Transaction } from "../lib/types";
import { settingsOf } from "../lib/bookSettings";
import { dateRangeFor, CheckboxList, DATE_LABELS, selectCls, labelCls, type DatePreset } from "./FilterBar";
import { REPORT_TYPES, summaryFor, type ReportType } from "../lib/report";

interface GenerateReportScreenProps {
  book: Book;
  transactions: Transaction[];
  onBack: () => void;
}

interface ReportFilters {
  datePreset: DatePreset;
  day?: number;
  start?: number;
  end?: number;
  entryType: "all" | "in" | "out";
  categories: string[];
  paymentModes: string[];
}

export default function GenerateReportScreen({ book, transactions, onBack }: GenerateReportScreenProps) {
  const settings = settingsOf(book);
  const [filters, setFilters] = useState<ReportFilters>({ datePreset: "all", entryType: "all", categories: [], paymentModes: [] });
  const [reportType, setReportType] = useState<ReportType>("all");

  const categories = useMemo(() => Array.from(new Set(transactions.map((t) => t.category).filter(Boolean))).sort(), [transactions]);
  const paymentModes = useMemo(() => Array.from(new Set(transactions.map((t) => t.paymentMode).filter(Boolean))).sort(), [transactions]);

  const filtered = useMemo(() => {
    const range = dateRangeFor({ preset: filters.datePreset, day: filters.day, start: filters.start, end: filters.end });
    return transactions.filter((t) => {
      if (filters.entryType !== "all" && t.type !== filters.entryType) return false;
      if (filters.categories.length && !filters.categories.includes(t.category)) return false;
      if (filters.paymentModes.length && !filters.paymentModes.includes(t.paymentMode)) return false;
      if (range && (t.occurredAt < range[0] || t.occurredAt > range[1])) return false;
      return true;
    });
  }, [transactions, filters]);

  async function generate(format: "pdf" | "csv") {
    const mod = await import("../lib/export");
    if (reportType === "all") {
      if (format === "pdf") mod.exportPDF(book.name, filtered);
      else mod.exportCSV(book.name, filtered);
      return;
    }
    const title = REPORT_TYPES.find((r) => r.key === reportType)?.title ?? "Report";
    const rows = summaryFor(reportType, filtered);
    if (format === "pdf") mod.exportSummaryPDF(book.name, title, rows);
    else mod.exportSummaryCSV(book.name, title, rows);
  }

  return (
    <div className="min-h-dvh bg-bg pb-10">
      <div className="flex items-center gap-2 px-2 pt-[calc(env(safe-area-inset-top)+0.25rem)]">
        <button onClick={onBack} aria-label="Back" className="press flex h-10 w-10 items-center justify-center rounded-full text-fg active:bg-fg/5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-fg">Generate Report</h1>
      </div>

      <div className="space-y-4 px-4 pt-3">
        <div>
          <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-fg-muted">Filters</h2>
          <div className="space-y-3 rounded-2xl border border-border/10 bg-surface p-3.5">
            <div>
              <label htmlFor="report-duration" className={labelCls}>
                Duration
              </label>
              <select
                id="report-duration"
                value={filters.datePreset}
                onChange={(e) => setFilters({ ...filters, datePreset: e.target.value as DatePreset })}
                className={selectCls}
              >
                {(Object.keys(DATE_LABELS) as DatePreset[]).map((p) => (
                  <option key={p} value={p}>
                    {DATE_LABELS[p]}
                  </option>
                ))}
              </select>
              {filters.datePreset === "singleDay" && (
                <input
                  type="date"
                  className={`${selectCls} mt-2`}
                  onChange={(e) => setFilters({ ...filters, day: e.target.valueAsNumber || undefined })}
                />
              )}
              {filters.datePreset === "range" && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    aria-label="Start date"
                    className={selectCls}
                    onChange={(e) => setFilters({ ...filters, start: e.target.valueAsNumber || undefined })}
                  />
                  <input
                    type="date"
                    aria-label="End date"
                    className={selectCls}
                    onChange={(e) => setFilters({ ...filters, end: e.target.valueAsNumber || undefined })}
                  />
                </div>
              )}
            </div>
            <div>
              <label htmlFor="report-type-filter" className={labelCls}>
                Entry Type
              </label>
              <select
                id="report-type-filter"
                value={filters.entryType}
                onChange={(e) => setFilters({ ...filters, entryType: e.target.value as ReportFilters["entryType"] })}
                className={selectCls}
              >
                <option value="all">All</option>
                <option value="in">Cash in</option>
                <option value="out">Cash out</option>
              </select>
            </div>
            {settings.categoryEnabled && (
              <CheckboxList label="Category" options={categories} selected={filters.categories} onChange={(categories) => setFilters({ ...filters, categories })} />
            )}
            {settings.paymentModeEnabled && (
              <CheckboxList
                label="Payment mode"
                options={paymentModes}
                selected={filters.paymentModes}
                onChange={(paymentModes) => setFilters({ ...filters, paymentModes })}
              />
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-fg-muted">Select Report Type</h2>
          <div className="space-y-2">
            {REPORT_TYPES.map((r) => {
              const disabled = r.key === "partyWise" && !settings.partyEnabled;
              return (
                <button
                  key={r.key}
                  disabled={disabled}
                  onClick={() => setReportType(r.key)}
                  className={`press flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left disabled:opacity-40 ${
                    reportType === r.key ? "border-brand bg-brand/10" : "border-border/10 bg-surface"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border-2 ${
                      reportType === r.key ? "border-brand" : "border-fg-muted"
                    }`}
                  >
                    {reportType === r.key && <span className="h-2 w-2 rounded-full bg-brand-solid" />}
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-fg">{r.title}</span>
                    <span className="block text-xs text-fg-muted">{r.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-fg-muted">{filtered.length} entries match these filters</p>

        <div className="grid grid-cols-2 gap-3 pb-4">
          <button onClick={() => void generate("csv")} className="press rounded-xl border border-brand py-3 text-sm font-bold text-brand">
            Generate Excel
          </button>
          <button onClick={() => void generate("pdf")} className="press rounded-xl bg-brand-solid py-3 text-sm font-bold text-on-brand">
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
}
