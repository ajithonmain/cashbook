import { useEffect, useState } from "react";
import type { Book, Transaction } from "../lib/types";
import { createBook, deleteBook, listBooks, listTransactions } from "../lib/db";
import { formatAmount } from "../lib/format";
import ConfirmDialog from "./ui/ConfirmDialog";
import Sheet from "./ui/Sheet";
import { showToast } from "../lib/toast";

interface BookWithBalance extends Book {
  balance: number;
}

interface BookListProps {
  onOpenBook: (book: Book) => void;
}

function BookRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="skeleton h-10 w-10 flex-none rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-28 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
      <div className="skeleton h-4 w-12 rounded" />
    </div>
  );
}

export default function BookList({ onOpenBook }: BookListProps) {
  const [books, setBooks] = useState<BookWithBalance[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BookWithBalance | null>(null);

  async function refresh() {
    const list = await listBooks();
    const withBalances = await Promise.all(
      list.map(async (b) => {
        const txns: Transaction[] = await listTransactions(b.id);
        const balance = txns.reduce((s, t) => s + (t.type === "in" ? t.amount : -t.amount), 0);
        return { ...b, balance };
      })
    );
    setBooks(withBalances);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    await createBook(name);
    setNewName("");
    setAddOpen(false);
    await refresh();
    showToast("Book created", { variant: "success" });
  }

  async function handleDelete(book: BookWithBalance) {
    setMenuFor(null);
    setConfirmDelete(null);
    await deleteBook(book.id);
    await refresh();
    showToast(`"${book.name}" deleted`, { variant: "default" });
  }

  return (
    <div className="min-h-dvh bg-bg pb-28">
      <div className="safe-top px-4 pb-2 pt-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg">Books</h1>
        <p className="text-sm text-fg-muted">Your ledgers</p>
      </div>

      <div className="px-4 pt-2">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-fg-muted">Your Books</h2>

        <button
          onClick={() => setAddOpen(true)}
          className="press mb-3 flex w-full items-center justify-between rounded-2xl border border-border/10 bg-surface p-4 text-left shadow-card"
        >
          <div>
            <p className="font-bold text-fg">Add New Book</p>
            <p className="text-xs text-fg-muted">Click to quickly add books</p>
          </div>
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand/15 text-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </span>
        </button>

        <div className="divide-y divide-border/10 overflow-hidden rounded-2xl border border-border/10 bg-surface shadow-card">
          {books === null && (
            <div className="divide-y divide-border/10">
              <BookRowSkeleton />
              <BookRowSkeleton />
              <BookRowSkeleton />
            </div>
          )}
          {books !== null && books.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-fg-muted">No books yet. Add your first one above.</p>
          )}
          {books?.map((b) => (
            <div key={b.id} className="relative flex items-center gap-3 px-4 py-3.5">
              <button onClick={() => onOpenBook(b)} className="press flex flex-1 items-center gap-3 text-left">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand/15 text-brand">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M6 4h10a2 2 0 0 1 2 2v14l-7-3-7 3V6a2 2 0 0 1 2-2Z" fill="currentColor" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-fg">{b.name}</span>
                  <span className="block text-xs text-fg-muted">
                    Updated{" "}
                    {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(
                      new Date(b.updatedAt)
                    )}
                  </span>
                </span>
              </button>
              <span className={`tabular text-sm font-bold ${b.balance >= 0 ? "text-in" : "text-out"}`}>
                {formatAmount(b.balance)}
              </span>
              <button
                onClick={() => setMenuFor(menuFor === b.id ? null : b.id)}
                className="press flex h-9 w-9 flex-none items-center justify-center rounded-full text-fg-muted active:bg-white/5"
                aria-label={`More options for ${b.name}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="1.6" />
                  <circle cx="12" cy="12" r="1.6" />
                  <circle cx="12" cy="19" r="1.6" />
                </svg>
              </button>
              {menuFor === b.id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} aria-hidden="true" />
                  <div className="absolute right-4 top-14 z-20 w-40 overflow-hidden rounded-xl border border-border/10 bg-surface-2 shadow-card">
                    <button
                      onClick={() => {
                        setConfirmDelete(b);
                        setMenuFor(null);
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm font-medium text-out active:bg-white/5"
                    >
                      Delete book
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {addOpen && (
        <Sheet onClose={() => setAddOpen(false)}>
          <div className="p-5">
            <h2 className="mb-4 text-lg font-bold text-fg">New Book</h2>
            <label htmlFor="new-book-name" className="mb-1.5 block text-xs font-semibold text-fg-muted">
              Book name
            </label>
            <input
              id="new-book-name"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
              placeholder="e.g. Personal"
              className="mb-4 w-full rounded-xl border border-border/10 bg-surface-2 px-3.5 py-3 text-base text-fg outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
            <button
              onClick={() => void handleCreate()}
              className="press w-full rounded-xl bg-brand py-3.5 text-base font-bold text-white"
            >
              Create book
            </button>
          </div>
        </Sheet>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${confirmDelete.name}"?`}
          description="This removes the book and all its entries. This cannot be undone."
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => void handleDelete(confirmDelete)}
        />
      )}
    </div>
  );
}
