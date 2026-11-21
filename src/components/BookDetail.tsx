import { useEffect, useMemo, useState } from "react";
import type { Book, EntryType, Transaction } from "../lib/types";
import { getCachedEntries, setCachedEntries } from "../lib/cache";
import { addTransaction, deleteTransaction, listTransactions, updateTransaction } from "../lib/db";
import BookAvatar from "./BookAvatar";
import Menu, { MenuItem } from "./ui/Menu";
import SummaryCard from "./ui/SummaryCard";
import FilterBar, { defaultFilters, type Filters } from "./FilterBar";
import TransactionList from "./TransactionList";
import TransactionForm from "./TransactionForm";
import { showToast } from "../lib/toast";
import { useDataVersion } from "../lib/sync";

interface BookDetailProps {
  book: Book;
  onBack: () => void;
}

const NO_ENTRIES: Transaction[] = [];

export default function BookDetail({ book, onBack }: BookDetailProps) {
  // Starts from the last known entries so the screen paints real data immediately; null only on a cold start.
  const [loaded, setLoaded] = useState<Transaction[] | null>(() => getCachedEntries(book.id) ?? null);
  const transactions = loaded ?? NO_ENTRIES;
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [formType, setFormType] = useState<EntryType | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  async function refresh() {
    const next = await listTransactions(book.id);
    setCachedEntries(book.id, next);
    setLoaded(next);
  }

  const dataVersion = useDataVersion();
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id, dataVersion]);

  const totalIn = transactions.filter((t) => t.type === "in").reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter((t) => t.type === "out").reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIn - totalOut;

  const categories = useMemo(() => Array.from(new Set(transactions.map((t) => t.category))).sort(), [transactions]);
  const parties = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.party).filter(Boolean))).sort(),
    [transactions]
  );
  const paymentModes = useMemo(() => Array.from(new Set(transactions.map((t) => t.paymentMode))).sort(), [transactions]);

  const filtered = transactions.filter((t) => {
    if (filters.type !== "all" && t.type !== filters.type) return false;
    if (filters.category && t.category !== filters.category) return false;
    if (filters.party && t.party !== filters.party) return false;
    if (filters.paymentMode && t.paymentMode !== filters.paymentMode) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!t.category.toLowerCase().includes(q) && !t.party.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  async function handleSubmit(data: {
    amount: number;
    category: string;
    party: string;
    paymentMode: string;
    remarks: string;
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

  return (
    <div className="relative min-h-dvh bg-bg pb-32">
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
          aria-label="Export options"
          aria-haspopup="menu"
          className="press flex h-10 w-10 items-center justify-center rounded-full text-fg active:bg-fg/5"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
            net={netBalance}
            totalIn={totalIn}
            totalOut={totalOut}
          />
        ) : (
          <div className="skeleton h-[84px] rounded-2xl" />
        )}
      </div>

      <FilterBar filters={filters} onChange={setFilters} categories={categories} parties={parties} paymentModes={paymentModes} />

      {loaded ? (
      <TransactionList
        transactions={filtered}
        runningBalanceEnd={netBalance}
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

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-border/10 bg-bg/85 px-4 pt-2 backdrop-blur-md">
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

      {formType && (
        <TransactionForm
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
