import { useEffect, useMemo, useState } from "react";
import type { Book, EntryType, Transaction } from "../lib/types";
import { addTransaction, deleteTransaction, listTransactions, updateTransaction } from "../lib/db";
import TopBar from "./TopBar";
import DashboardCard from "./DashboardCard";
import FilterBar, { type Filters } from "./FilterBar";
import TransactionList from "./TransactionList";
import TransactionForm from "./TransactionForm";
import { exportCSV, exportPDF } from "../lib/export";
import { showToast } from "../lib/toast";

interface BookDetailProps {
  book: Book;
  onBack: () => void;
}

const defaultFilters: Filters = { search: "", type: "all", category: "", party: "", paymentMode: "" };

export default function BookDetail({ book, onBack }: BookDetailProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [formType, setFormType] = useState<EntryType | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  async function refresh() {
    setTransactions(await listTransactions(book.id));
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id]);

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
      <TopBar
        title={book.name}
        subtitle={`${transactions.length} ${transactions.length === 1 ? "entry" : "entries"}`}
        onBack={onBack}
        right={
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Export options"
              aria-expanded={menuOpen}
              className="press flex h-10 w-10 items-center justify-center rounded-full text-fg active:bg-white/5"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                <div className="absolute right-0 top-12 z-20 w-48 overflow-hidden rounded-xl border border-border/10 bg-surface-2 shadow-card">
                  <button
                    onClick={() => {
                      exportPDF(book.name, filtered);
                      setMenuOpen(false);
                      showToast("PDF exported", { variant: "success" });
                    }}
                    className="block w-full px-4 py-3 text-left text-sm font-medium text-fg active:bg-white/5"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => {
                      exportCSV(book.name, filtered);
                      setMenuOpen(false);
                      showToast("CSV exported", { variant: "success" });
                    }}
                    className="block w-full px-4 py-3 text-left text-sm font-medium text-fg active:bg-white/5"
                  >
                    Export as Excel (CSV)
                  </button>
                </div>
              </>
            )}
          </div>
        }
      />

      <FilterBar filters={filters} onChange={setFilters} categories={categories} parties={parties} paymentModes={paymentModes} />

      <DashboardCard netBalance={netBalance} totalIn={totalIn} totalOut={totalOut} />

      <TransactionList
        transactions={filtered}
        runningBalanceEnd={netBalance}
        onSelect={(t) => {
          setEditing(t);
          setFormType(t.type);
        }}
        onDelete={(t) => void handleDelete(t)}
      />

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-border/10 bg-bg/85 px-4 pt-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md gap-3 pb-3">
          <button
            onClick={() => {
              setEditing(null);
              setFormType("in");
            }}
            className="press flex flex-1 items-center justify-center gap-2 rounded-2xl bg-in py-3.5 text-base font-extrabold text-bg shadow-card"
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
            className="press flex flex-1 items-center justify-center gap-2 rounded-2xl bg-out py-3.5 text-base font-extrabold text-bg shadow-card"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Cash Out
          </button>
        </div>
      </div>

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
