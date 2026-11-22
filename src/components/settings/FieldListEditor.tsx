import { useState } from "react";
import type { Book } from "../../lib/types";
import { settingsOf } from "../../lib/bookSettings";
import { listBooks } from "../../lib/db";
import ConfirmDialog from "../ui/ConfirmDialog";
import Sheet from "../ui/Sheet";

const inputCls =
  "w-full rounded-xl border border-border/10 bg-surface-2 px-3 py-2.5 text-base text-fg outline-none placeholder:text-fg-muted focus:border-brand focus:ring-2 focus:ring-brand/30";

function UpDown({ onUp, onDown }: { onUp?: () => void; onDown?: () => void }) {
  return (
    <span className="flex flex-none flex-col">
      <button
        onClick={onUp}
        disabled={!onUp}
        aria-label="Move up"
        className="press flex h-5 w-6 items-center justify-center text-fg-muted disabled:opacity-20"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        onClick={onDown}
        disabled={!onDown}
        aria-label="Move down"
        className="press flex h-5 w-6 items-center justify-center text-fg-muted disabled:opacity-20"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </span>
  );
}

/** A reorderable, editable list of plain strings: this book's Category or Payment Mode options. */
export function StringListEditor({
  book,
  items,
  onChange,
  addLabel,
  importKey,
}: {
  book: Book;
  items: string[];
  onChange: (next: string[]) => void;
  addLabel: string;
  importKey: "categories" | "paymentModes";
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [renaming, setRenaming] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [toDelete, setToDelete] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);

  function move(index: number, dir: -1 | 1) {
    const next = items.slice();
    const [item] = next.splice(index, 1);
    next.splice(index + dir, 0, item);
    onChange(next);
  }

  function commitAdd() {
    const name = draft.trim();
    if (name && !items.includes(name)) onChange([...items, name]);
    setDraft("");
    setAdding(false);
  }

  function commitRename(index: number) {
    const name = renameValue.trim();
    if (name) {
      const next = items.slice();
      next[index] = name;
      onChange(next);
    }
    setRenaming(null);
  }

  return (
    <div className="space-y-2">
      {adding ? (
        <div className="flex gap-2">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitAdd()}
            placeholder="Name"
            className={inputCls}
          />
          <button onClick={commitAdd} className="press flex-none rounded-xl bg-brand-solid px-4 text-sm font-bold text-on-brand">
            Add
          </button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="press w-full rounded-xl border border-border/10 py-2.5 text-sm font-bold text-brand">
          + {addLabel}
        </button>
      )}
      <button
        onClick={() => setImporting(true)}
        className="press w-full rounded-xl border border-border/10 py-2.5 text-sm font-bold text-brand"
      >
        Import from other books
      </button>

      <div className="divide-y divide-border/10 overflow-hidden rounded-2xl border border-border/10 bg-surface">
        {items.map((item, i) =>
          renaming === i ? (
            <div key={i} className="flex gap-2 px-3 py-2">
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitRename(i)}
                onBlur={() => commitRename(i)}
                className={inputCls}
              />
            </div>
          ) : (
            <div key={item} className="flex items-center gap-2 px-3 py-1">
              <UpDown onUp={i > 0 ? () => move(i, -1) : undefined} onDown={i < items.length - 1 ? () => move(i, 1) : undefined} />
              <button
                onClick={() => {
                  setRenameValue(item);
                  setRenaming(i);
                }}
                className="press min-w-0 flex-1 truncate py-2 text-left text-sm font-medium text-fg"
              >
                {item}
              </button>
              <button onClick={() => setToDelete(i)} aria-label={`Delete ${item}`} className="press flex-none p-2 text-fg-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )
        )}
        {items.length === 0 && <p className="px-4 py-6 text-center text-xs text-fg-muted">Nothing yet.</p>}
      </div>

      {toDelete !== null && (
        <ConfirmDialog
          title={`Delete "${items[toDelete]}"?`}
          description="Past entries keep this value; it just won't be offered for new ones."
          confirmLabel="Delete"
          onCancel={() => setToDelete(null)}
          onConfirm={() => {
            onChange(items.filter((_, i) => i !== toDelete));
            setToDelete(null);
          }}
        />
      )}

      {importing && (
        <ImportSheet
          book={book}
          importKey={importKey}
          onClose={() => setImporting(false)}
          onImport={(names) => {
            onChange(Array.from(new Set([...items, ...names])));
            setImporting(false);
          }}
        />
      )}
    </div>
  );
}

function ImportSheet({
  book,
  importKey,
  onClose,
  onImport,
}: {
  book: Book;
  importKey: "categories" | "paymentModes";
  onClose: () => void;
  onImport: (names: string[]) => void;
}) {
  const [books, setBooks] = useState<Book[] | null>(null);
  useState(() => {
    void listBooks().then((all) => setBooks(all.filter((b) => b.id !== book.id)));
  });

  return (
    <Sheet onClose={onClose}>
      <div className="space-y-3 px-5 pb-6 pt-1">
        <h2 className="text-base font-bold text-fg">Import from other books</h2>
        {books === null && <div className="skeleton h-10 rounded-xl" />}
        {books?.length === 0 && <p className="text-sm text-fg-muted">No other books yet.</p>}
        <div className="divide-y divide-border/10 overflow-hidden rounded-2xl border border-border/10 bg-surface">
          {books?.map((b) => (
            <button
              key={b.id}
              onClick={() => onImport(settingsOf(b)[importKey])}
              className="press block w-full px-4 py-3 text-left text-sm font-semibold text-fg"
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
