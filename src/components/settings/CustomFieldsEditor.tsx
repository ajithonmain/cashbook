import { useState } from "react";
import type { CustomField } from "../../lib/types";
import ConfirmDialog from "../ui/ConfirmDialog";

const inputCls =
  "w-full rounded-xl border border-border/10 bg-surface-2 px-3 py-2.5 text-base text-fg outline-none placeholder:text-fg-muted focus:border-brand focus:ring-2 focus:ring-brand/30";

function UpDown({ onUp, onDown }: { onUp?: () => void; onDown?: () => void }) {
  return (
    <span className="flex flex-none flex-col">
      <button onClick={onUp} disabled={!onUp} aria-label="Move up" className="press flex h-5 w-6 items-center justify-center text-fg-muted disabled:opacity-20">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button onClick={onDown} disabled={!onDown} aria-label="Move down" className="press flex h-5 w-6 items-center justify-center text-fg-muted disabled:opacity-20">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </span>
  );
}

/** Add/rename/delete/reorder a book's user-defined extra entry fields (stable ids; rename keeps past values). */
export default function CustomFieldsEditor({ items, onChange }: { items: CustomField[]; onChange: (next: CustomField[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [toDelete, setToDelete] = useState<CustomField | null>(null);

  function move(index: number, dir: -1 | 1) {
    const next = items.slice();
    const [item] = next.splice(index, 1);
    next.splice(index + dir, 0, item);
    onChange(next);
  }

  function commitAdd() {
    const name = draft.trim();
    if (name) onChange([...items, { id: crypto.randomUUID(), name }]);
    setDraft("");
    setAdding(false);
  }

  function commitRename(id: string) {
    const name = renameValue.trim();
    if (name) onChange(items.map((f) => (f.id === id ? { ...f, name } : f)));
    setRenaming(null);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-fg-muted">Extra text fields shown on every Cash In / Cash Out entry in this book.</p>
      {adding ? (
        <div className="flex gap-2">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitAdd()}
            placeholder="Field name, e.g. Invoice #"
            className={inputCls}
          />
          <button onClick={commitAdd} className="press flex-none rounded-xl bg-brand-solid px-4 text-sm font-bold text-on-brand">
            Add
          </button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="press w-full rounded-xl border border-border/10 py-2.5 text-sm font-bold text-brand">
          + Add field
        </button>
      )}

      <div className="divide-y divide-border/10 overflow-hidden rounded-2xl border border-border/10 bg-surface">
        {items.map((field, i) =>
          renaming === field.id ? (
            <div key={field.id} className="flex gap-2 px-3 py-2">
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitRename(field.id)}
                onBlur={() => commitRename(field.id)}
                className={inputCls}
              />
            </div>
          ) : (
            <div key={field.id} className="flex items-center gap-2 px-3 py-1">
              <UpDown onUp={i > 0 ? () => move(i, -1) : undefined} onDown={i < items.length - 1 ? () => move(i, 1) : undefined} />
              <button
                onClick={() => {
                  setRenameValue(field.name);
                  setRenaming(field.id);
                }}
                className="press min-w-0 flex-1 truncate py-2 text-left text-sm font-medium text-fg"
              >
                {field.name}
              </button>
              <button onClick={() => setToDelete(field)} aria-label={`Delete ${field.name}`} className="press flex-none p-2 text-fg-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )
        )}
        {items.length === 0 && <p className="px-4 py-6 text-center text-xs text-fg-muted">No custom fields yet.</p>}
      </div>

      {toDelete && (
        <ConfirmDialog
          title={`Delete "${toDelete.name}"?`}
          description="Past entries keep their saved value; it just won't be shown or editable any more."
          confirmLabel="Delete"
          onCancel={() => setToDelete(null)}
          onConfirm={() => {
            onChange(items.filter((f) => f.id !== toDelete.id));
            setToDelete(null);
          }}
        />
      )}
    </div>
  );
}
