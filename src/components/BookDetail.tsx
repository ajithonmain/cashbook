import { useEffect, useMemo, useRef, useState } from "react";
import type { Book, EntryType, Transaction } from "../lib/types";
import { getCachedEntries, setCachedEntries } from "../lib/cache";
import {
  addTransaction,
  deleteTransaction,
  deleteTransactions,
  importTransactions,
  listBooks,
  listTransactions,
  updateTransaction,
} from "../lib/db";
import { parseEntriesCsv, withImportedOptions, withoutExisting } from "../lib/csvImport";
import { settingsOf } from "../lib/bookSettings";
import ImportSheet, { type ImportPreview } from "./ImportSheet";
import BookAvatar from "./BookAvatar";
import Menu, { MenuItem } from "./ui/Menu";
import SummaryCard from "./ui/SummaryCard";
import FilterBar, { dateRangeFor, defaultFilters, type Filters } from "./FilterBar";
import TransactionList from "./TransactionList";
import TransactionForm from "./TransactionForm";
import BookSettingsScreen from "./BookSettingsScreen";
import GenerateReportScreen from "./GenerateReportScreen";
import { showToast } from "../lib/toast";
import { useDataVersion } from "../lib/sync";
import { totalsOf } from "../lib/totals";

interface BookDetailProps {
  book: Book;
  onBack: () => void;
}

const NO_ENTRIES: Transaction[] = [];
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export default function BookDetail({ book: initialBook, onBack }: BookDetailProps) {
  const [book, setBook] = useState(initialBook);
  // Starts from the last known entries so the screen paints real data immediately; null only on a cold start.
  const [loaded, setLoaded] = useState<Transaction[] | null>(() => getCachedEntries(book.id) ?? null);
  const transactions = loaded ?? NO_ENTRIES;
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [formType, setFormType] = useState<EntryType | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [screen, setScreen] = useState<"detail" | "settings" | "report">("detail");

  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function refresh() {
    const [next, books] = await Promise.all([listTransactions(book.id), listBooks()]);
    setCachedEntries(book.id, next);
    setLoaded(next);
    const live = books.find((b) => b.id === book.id);
    if (live) setBook(live);
  }

  const dataVersion = useDataVersion();
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id, dataVersion]);

  const categories = useMemo(() => Array.from(new Set(transactions.map((t) => t.category).filter(Boolean))).sort(), [transactions]);
  const parties = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.party).filter(Boolean))).sort(),
    [transactions]
  );
  const paymentModes = useMemo(() => Array.from(new Set(transactions.map((t) => t.paymentMode).filter(Boolean))).sort(), [transactions]);

  const filtered = transactions.filter((t) => {
    if (filters.type !== "all" && t.type !== filters.type) return false;
    if (filters.categories.length && !filters.categories.includes(t.category)) return false;
    if (filters.parties.length && !filters.parties.includes(t.party)) return false;
    if (filters.paymentModes.length && !filters.paymentModes.includes(t.paymentMode)) return false;
    const range = dateRangeFor(filters.date);
    if (range && (t.occurredAt < range[0] || t.occurredAt > range[1])) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const amountStr = String(t.amount);
      if (!t.remarks.toLowerCase().includes(q) && !amountStr.includes(q)) return false;
    }
    return true;
  });

  // Summary card and running balances describe the entries on screen, so they follow the filters.
  const { totalIn, totalOut, net } = totalsOf(filtered);

  const filtersActive =
    filters.type !== "all" ||
    filters.categories.length > 0 ||
    filters.parties.length > 0 ||
    filters.paymentModes.length > 0 ||
    filters.date.preset !== "all" ||
    filters.search !== "";

  async function handleSubmit(data: {
    amount: number;
    category: string;
    party: string;
    paymentMode: string;
    remarks: string;
    customFields?: Record<string, string>;
    occurredAt: number;
  }) {
    if (editing) {
      await updateTransaction(editing.id, data);
      showToast("Entry updated", { variant: "success" });
    } else if (formType) {
      await addTransaction({ bookId: book.id, type: formType, ...data });
      showToast(formType === "in" ? "Cash In saved" : "Cash Out saved", { variant: "success" });
    }
    setFormType(null);
    setEditing(null);
    await refresh();
  }

  async function handleDelete(t: Transaction) {
    await deleteTransaction(t.id);
    setEditing(null);
    setFormType(null);
    await refresh();
    showToast("Entry deleted", {
      actionLabel: "Undo",
      durationMs: 5000,
      onAction: () => {
        void updateTransaction(t.id, { deleted: false }).then(refresh);
      },
    });
  }

  async function readImportFile(file: File) {
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error("File is larger than 5 MB.");
      const { entries, skipped } = parseEntriesCsv(await file.text());
      const fresh = withoutExisting(entries, await listTransactions(book.id));
      setImportPreview({ fileName: file.name, fresh, duplicates: entries.length - fresh.length, skipped });
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not read the file", { variant: "error" });
    }
  }

  async function confirmImport(preview: ImportPreview) {
    try {
      const settings = withImportedOptions(settingsOf(book), preview.fresh);
      const ids = await importTransactions(book.id, preview.fresh, settings ?? undefined);
      setImportPreview(null);
      setFilters(defaultFilters);
      await refresh();
      showToast(`Imported ${ids.length} ${ids.length === 1 ? "entry" : "entries"}`, {
        variant: "success",
        actionLabel: "Undo",
        durationMs: 8000,
        onAction: () => {
          void deleteTransactions(ids).then(refresh);
        },
      });
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Import failed", { variant: "error" });
    }
  }

  if (screen === "settings") {
    return (
      <div className="h-full overflow-y-auto overscroll-contain">
        <BookSettingsScreen book={book} onBack={() => setScreen("detail")} onBookChanged={() => void refresh()} />
      </div>
    );
  }

  if (screen === "report") {
    return (
      <div className="h-full overflow-y-auto overscroll-contain">
        <GenerateReportScreen book={book} transactions={transactions} onBack={() => setScreen("detail")} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4">
      <div className="flex items-center justify-between px-2 pt-[calc(env(safe-area-inset-top)+0.25rem)]">
        <button
          onClick={onBack}
          aria-label="Back to books"
          className="press flex h-10 w-10 items-center justify-center rounded-full text-fg active:bg-fg/5"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          aria-label="Book options"
          aria-haspopup="menu"
          className="press flex h-10 w-10 items-center justify-center rounded-full text-fg active:bg-fg/5"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="5" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="12" cy="19" r="1.6" />
          </svg>
        </button>
      </div>

      <div className="px-4 pt-1">
        {loaded ? (
          <SummaryCard
            label={
              <span className="flex items-center gap-1.5">
                <BookAvatar book={book} size={18} />
                <span className="truncate">{book.name}</span>
              </span>
            }
            net={net}
            totalIn={totalIn}
            totalOut={totalOut}
          />
        ) : (
          <div className="skeleton h-[84px] rounded-2xl" />
        )}
        {loaded && (
          <div className="mt-1.5 flex items-center justify-between px-1 text-xs">
            <button onClick={() => setScreen("settings")} className="press font-semibold text-fg-muted">
              Book settings
            </button>
            <button onClick={() => fileInput.current?.click()} className="press font-semibold text-fg-muted">
              Import CSV
            </button>
            <button onClick={() => setScreen("report")} className="press font-bold text-brand">
              View reports
            </button>
          </div>
        )}
      </div>

      <FilterBar filters={filters} onChange={setFilters} categories={categories} parties={parties} paymentModes={paymentModes} />

      {filtersActive && loaded && (
        <p className="px-4 pb-1 text-xs text-fg-muted">
          Showing {filtered.length} of {transactions.length} entries
        </p>
      )}

      {loaded ? (
      <TransactionList
        filtered={filtersActive}
        transactions={filtered}
        runningBalanceEnd={net}
        onSelect={(t) => {
          setEditing(t);
          setFormType(t.type);
        }}
        onDelete={(t) => void handleDelete(t)}
      />
      ) : (
        <div className="mt-4 space-y-px">
          <div className="skeleton h-12" />
          <div className="skeleton h-12" />
          <div className="skeleton h-12" />
        </div>
      )}

      </div>

      <div className="safe-bottom flex-none border-t border-border/10 bg-bg px-4 pt-2">
        <div className="mx-auto flex max-w-md gap-2 pb-2">
          <button
            onClick={() => {
              setEditing(null);
              setFormType("in");
            }}
            className="press flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-in-solid py-2.5 text-sm font-bold text-on-in shadow-card"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Cash In
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setFormType("out");
            }}
            className="press flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-out-solid py-2.5 text-sm font-bold text-on-out shadow-card"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Cash Out
          </button>
        </div>
      </div>

      {menuAnchor && (
        <Menu anchor={menuAnchor} onClose={() => setMenuAnchor(null)}>
          <MenuItem
            onClick={() => {
              setScreen("settings");
              setMenuAnchor(null);
            }}
          >
            Book settings
          </MenuItem>
          <MenuItem
            onClick={() => {
              setScreen("report");
              setMenuAnchor(null);
            }}
          >
            Generate report
          </MenuItem>
          <MenuItem
            onClick={() => {
              fileInput.current?.click();
              setMenuAnchor(null);
            }}
          >
            Import CSV
          </MenuItem>
          <MenuItem
            onClick={() => {
              void import("../lib/export").then((m) => m.exportPDF(book.name, filtered));
              setMenuAnchor(null);
              showToast("PDF exported", { variant: "success" });
            }}
          >
            Export as PDF
          </MenuItem>
          <MenuItem
            onClick={() => {
              void import("../lib/export").then((m) => m.exportCSV(book.name, filtered));
              setMenuAnchor(null);
              showToast("CSV exported", { variant: "success" });
            }}
          >
            Export as Excel (CSV)
          </MenuItem>
        </Menu>
      )}

      <input
        ref={fileInput}
        type="file"
        accept=".csv,text/csv,text/comma-separated-values"
        className="hidden"
        aria-label="CSV file to import"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Cleared so picking the same file again still fires a change event.
          e.target.value = "";
          if (file) void readImportFile(file);
        }}
      />

      {importPreview && (
        <ImportSheet
          preview={importPreview}
          bookName={book.name}
          onClose={() => setImportPreview(null)}
          onImport={() => confirmImport(importPreview)}
        />
      )}

      {formType && (
        <TransactionForm
          book={book}
          type={formType}
          initial={editing ?? undefined}
          onClose={() => {
            setFormType(null);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
          onDelete={editing ? () => void handleDelete(editing) : undefined}
        />
      )}
    </div>
  );
}
