import { useState } from "react";
import type { Book, BookSettings } from "../lib/types";
import { settingsOf } from "../lib/bookSettings";
import { updateBook, updateBookSettings } from "../lib/db";
import BookAvatar from "./BookAvatar";
import BookEditSheet from "./BookEditSheet";
import { StringListEditor } from "./settings/FieldListEditor";
import CustomFieldsEditor from "./settings/CustomFieldsEditor";
import { Row } from "./ui/ListGroup";

type View = "main" | "entryFields" | "party" | "categories" | "paymentModes" | "customFields";

interface BookSettingsScreenProps {
  book: Book;
  onBack: () => void;
  onBookChanged: () => void;
}

function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2 px-2 pt-[calc(env(safe-area-inset-top)+0.25rem)]">
      <button onClick={onBack} aria-label="Back" className="press flex h-10 w-10 items-center justify-center rounded-full text-fg active:bg-fg/5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <h1 className="text-base font-bold text-fg">{title}</h1>
    </div>
  );
}

function ToggleRow({ title, sub, checked, onChange }: { title: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row
      title={title}
      sub={sub}
      right={
        <button
          role="switch"
          aria-checked={checked}
          aria-label={title}
          onClick={() => onChange(!checked)}
          className={`press relative h-6 w-11 flex-none rounded-full transition-colors ${checked ? "bg-brand-solid" : "bg-fg/15"}`}
        >
          <span
            className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
            style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
          />
        </button>
      }
    />
  );
}

export default function BookSettingsScreen({ book, onBack, onBookChanged }: BookSettingsScreenProps) {
  const [view, setView] = useState<View>("main");
  const [settings, setSettings] = useState<BookSettings>(settingsOf(book));
  const [editingName, setEditingName] = useState(false);

  async function save(next: BookSettings) {
    setSettings(next);
    await updateBookSettings(book.id, next);
    onBookChanged();
  }

  async function renameBook(value: { name: string; icon: string; color: number }) {
    await updateBook(book.id, value);
    setEditingName(false);
    onBookChanged();
  }

  function backFor(view: View): () => void {
    if (view === "main") return onBack;
    if (view === "entryFields") return () => setView("main");
    return () => setView("entryFields");
  }

  if (view === "party") {
    return (
      <div className="min-h-dvh bg-bg pb-10">
        <BackHeader title="Party Settings" onBack={backFor(view)} />
        <div className="space-y-px px-4 pt-3">
          <div className="overflow-hidden rounded-2xl border border-border/10 bg-surface">
            <div className="px-3.5">
              <ToggleRow title="Show field" checked={settings.partyEnabled} onChange={(v) => void save({ ...settings, partyEnabled: v })} />
              <ToggleRow
                title="Required field"
                checked={settings.partyRequired}
                onChange={(v) => void save({ ...settings, partyRequired: v })}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "categories" || view === "paymentModes") {
    const isCategory = view === "categories";
    const enabled = isCategory ? settings.categoryEnabled : settings.paymentModeEnabled;
    const required = isCategory ? settings.categoryRequired : settings.paymentModeRequired;
    const items = isCategory ? settings.categories : settings.paymentModes;
    return (
      <div className="min-h-dvh bg-bg pb-10">
        <BackHeader title={isCategory ? "Category Settings" : "Payment Mode Settings"} onBack={backFor(view)} />
        <div className="space-y-4 px-4 pt-3">
          <div className="overflow-hidden rounded-2xl border border-border/10 bg-surface px-3.5">
            <ToggleRow
              title="Show field"
              checked={enabled}
              onChange={(v) => void save(isCategory ? { ...settings, categoryEnabled: v } : { ...settings, paymentModeEnabled: v })}
            />
            <ToggleRow
              title="Required field"
              checked={required}
              onChange={(v) => void save(isCategory ? { ...settings, categoryRequired: v } : { ...settings, paymentModeRequired: v })}
            />
          </div>
          <StringListEditor
            book={book}
            items={items}
            addLabel={isCategory ? "Add new Category" : "Add new Payment Mode"}
            importKey={isCategory ? "categories" : "paymentModes"}
            onChange={(next) => void save(isCategory ? { ...settings, categories: next } : { ...settings, paymentModes: next })}
          />
        </div>
      </div>
    );
  }

  if (view === "customFields") {
    return (
      <div className="min-h-dvh bg-bg pb-10">
        <BackHeader title="Custom Entry Fields" onBack={backFor(view)} />
        <div className="px-4 pt-3">
          <CustomFieldsEditor items={settings.customFields} onChange={(next) => void save({ ...settings, customFields: next })} />
        </div>
      </div>
    );
  }

  if (view === "entryFields") {
    return (
      <div className="min-h-dvh bg-bg pb-10">
        <BackHeader title="Entry Field Settings" onBack={backFor(view)} />
        <div className="space-y-px overflow-hidden rounded-2xl border border-border/10 bg-surface px-3.5 mx-4 mt-3">
          <Row
            title="Party"
            sub="Rename, show or require"
            onClick={() => setView("party")}
            right={<span className="text-xs font-semibold text-fg-muted">{settings.partyEnabled ? "ON" : "OFF"}</span>}
          />
          <Row
            title="Category"
            sub="Rename, delete, reorder, add new or hide"
            onClick={() => setView("categories")}
            right={<span className="text-xs font-semibold text-fg-muted">{settings.categoryEnabled ? "ON" : "OFF"}</span>}
          />
          <Row
            title="Payment mode"
            sub="Rename, delete, reorder, add new or hide"
            onClick={() => setView("paymentModes")}
            right={<span className="text-xs font-semibold text-fg-muted">{settings.paymentModeEnabled ? "ON" : "OFF"}</span>}
          />
          <Row
            title="Custom Entry Fields"
            sub="Add, rename, delete and reorder new fields"
            onClick={() => setView("customFields")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg pb-10">
      <BackHeader title="Book Settings" onBack={onBack} />
      <div className="px-4 pt-3">
        <Row
          title={
            <span className="flex items-center gap-2">
              <BookAvatar book={book} size={20} />
              <span>
                <span className="block text-[11px] font-normal text-fg-muted">Cashbook Name</span>
                {book.name}
              </span>
            </span>
          }
          right={
            <button onClick={() => setEditingName(true)} className="press rounded-xl border border-brand px-3 py-1.5 text-xs font-bold text-brand">
              Rename
            </button>
          }
        />
        <h2 className="mb-1.5 mt-4 text-[11px] font-bold uppercase tracking-wider text-fg-muted">General Book Settings</h2>
        <div className="overflow-hidden rounded-2xl border border-border/10 bg-surface px-3.5">
          <Row title="Entry Field Settings" sub="Category, Payment Mode, Party, Custom fields" onClick={() => setView("entryFields")} />
        </div>
      </div>

      {editingName && (
        <BookEditSheet book={book} usedHues={[]} onClose={() => setEditingName(false)} onSave={(v) => void renameBook(v)} />
      )}
    </div>
  );
}
