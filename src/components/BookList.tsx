import { useEffect, useState } from "react";
import type { Book, Transaction } from "../lib/types";
import { createBook, deleteBook, listBooks, listTransactions, updateBook } from "../lib/db";
import { pickAutoHue, styleOf } from "../lib/bookStyle";
import { formatAmount } from "../lib/format";
import ConfirmDialog from "./ui/ConfirmDialog";
import BookAvatar from "./BookAvatar";
import BookEditSheet from "./BookEditSheet";
import Menu, { MenuItem } from "./ui/Menu";
import SummaryCard from "./ui/SummaryCard";
import SyncBadge from "./ui/SyncBadge";
import { setCachedEntries } from "../lib/cache";
import { showToast } from "../lib/toast";
import { useDataVersion } from "../lib/sync";

interface BookWithTotals extends Book {
  totalIn: number;
  totalOut: number;
}

interface BookListProps {
  onOpenBook: (book: Book) => void;
}

const normalized = new Set<string>();

/**
 * Books saved before colors existed have none and would all render from a name hash, which can collide.
 * Give each one a distinct stored hue, once, in creation order.
 */
async function normalizeLegacyColors(list: Book[]): Promise<Book[]> {
  const legacy = list.filter((b) => typeof b.color !== "number" && !normalized.has(b.id));
  if (legacy.length === 0) return list;
  const used = list.filter((b) => typeof b.color === "number").map((b) => b.color as number);
  const next = new Map<string, number>();
  for (const b of legacy.sort((a, c) => a.createdAt - c.createdAt)) {
    normalized.add(b.id);
    const hue = pickAutoHue(b.name, used);
    used.push(hue);
    next.set(b.id, hue);
    await updateBook(b.id, { name: b.name, icon: styleOf(b).icon, color: hue });
  }
  return list.map((b) => (next.has(b.id) ? { ...b, color: next.get(b.id)! } : b));
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5">
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
  const [books, setBooks] = useState<BookWithTotals[] | null>(null);
  const [editing, setEditing] = useState<BookWithTotals | "new" | null>(null);
  const [menu, setMenu] = useState<{ book: BookWithTotals; anchor: HTMLElement } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BookWithTotals | null>(null);

  async function refresh() {
    const list = await normalizeLegacyColors(await listBooks());
    setBooks(
      await Promise.all(
        list.map(async (b) => {
          const txns: Transaction[] = await listTransactions(b.id);
          setCachedEntries(b.id, txns);
          return {
            ...b,
            totalIn: txns.filter((t) => t.type === "in").reduce((s, t) => s + t.amount, 0),
            totalOut: txns.filter((t) => t.type === "out").reduce((s, t) => s + t.amount, 0),
          };
        })
      )
    );
  }

  const dataVersion = useDataVersion();
  useEffect(() => {
    void refresh();
  }, [dataVersion]);

  async function handleSave(value: { name: string; icon: string; color: number }) {
    if (editing === "new") {
      await createBook(value.name, value);
      showToast("Book created", { variant: "success" });
    } else if (editing) {
      await updateBook(editing.id, value);
      showToast("Book updated", { variant: "success" });
    }
    setEditing(null);
    await refresh();
  }

  async function handleDelete(book: BookWithTotals) {
    setConfirmDelete(null);
    await deleteBook(book.id);
    await refresh();
    showToast(`"${book.name}" deleted`);
  }

  const totalIn = books?.reduce((s, b) => s + b.totalIn, 0) ?? 0;
  const totalOut = books?.reduce((s, b) => s + b.totalOut, 0) ?? 0;

  return (
    <div className="min-h-dvh bg-bg px-4 pb-32 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <SummaryCard label="Total balance" net={totalIn - totalOut} totalIn={totalIn} totalOut={totalOut} badge={<SyncBadge />} />

      <div className="mb-1.5 mt-4 flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-fg-muted">Books</h2>
        {books && books.length > 0 && <span className="text-xs text-fg-muted">{books.length}</span>}
      </div>

      <div className="divide-y divide-border/10 overflow-hidden rounded-2xl border border-border/10 bg-surface shadow-card">
        {books === null && (
          <>
            <RowSkeleton />
            <RowSkeleton />
          </>
        )}
        {books?.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-fg-muted">No books yet. Tap New book to start.</p>
        )}
        {books?.map((b) => {
          const balance = b.totalIn - b.totalOut;
          return (
            <div key={b.id} className="relative flex items-center">
              <button onClick={() => onOpenBook(b)} className="press flex min-w-0 flex-1 items-center gap-3 px-3.5 py-2.5 text-left">
                <BookAvatar book={b} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-fg">{b.name}</span>
                  <span className="block text-[11px] text-fg-muted">
                    {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(b.updatedAt))}
                  </span>
                </span>
                <span className={`tabular text-sm font-bold ${balance < 0 ? "text-out" : "text-fg"}`}>{formatAmount(balance)}</span>
              </button>
              <button
                onClick={(e) => setMenu({ book: b, anchor: e.currentTarget })}
                className="press mr-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-full text-fg-muted active:bg-fg/5"
                aria-label={`More options for ${b.name}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="12" cy="5" r="1.6" />
                  <circle cx="12" cy="12" r="1.6" />
                  <circle cx="12" cy="19" r="1.6" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {menu && (
        <Menu anchor={menu.anchor} onClose={() => setMenu(null)}>
          <MenuItem
            onClick={() => {
              setEditing(menu.book);
              setMenu(null);
            }}
          >
            Edit
          </MenuItem>
          <MenuItem
            danger
            onClick={() => {
              setConfirmDelete(menu.book);
              setMenu(null);
            }}
          >
            Delete book
          </MenuItem>
        </Menu>
      )}

      <button
        onClick={() => setEditing("new")}
        className="press fixed right-4 z-30 flex h-10 items-center gap-1.5 rounded-full bg-brand-solid pl-3.5 pr-4 text-xs font-bold text-on-brand shadow-card"
        style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        New book
      </button>

      {editing && (
        <BookEditSheet
          book={editing === "new" ? undefined : editing}
          usedHues={(books ?? []).filter((b) => b !== editing).map((b) => styleOf(b).hue)}
          onClose={() => setEditing(null)} onSave={(v) => void handleSave(v)} />
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
