import { useEffect, useRef, useState } from "react";
import type { Book } from "../lib/types";
import { ICON_KEYS, pickAutoHue, styleOf, suggestIcon, SWATCH_HUES, type IconKey } from "../lib/bookStyle";
import BookAvatar, { IconGlyph } from "./BookAvatar";
import Sheet from "./ui/Sheet";

interface BookEditSheetProps {
  /** Omit to create a new book. */
  book?: Book;
  /** Hues already used by the user's other books; Auto avoids all of them. */
  usedHues: number[];
  onClose: () => void;
  onSave: (value: { name: string; icon: IconKey; color: number }) => void;
}

const labelCls = "mb-1.5 block text-xs font-semibold text-fg-muted";

export default function BookEditSheet({ book, usedHues, onClose, onSave }: BookEditSheetProps) {
  const initial = book ? styleOf(book) : null;
  const [name, setName] = useState(book?.name ?? "");
  // Until the user taps an icon, it follows the name ("Trip to Goa" suggests the plane).
  const [pickedIcon, setPickedIcon] = useState<IconKey | null>(initial?.icon ?? null);
  // null = Auto (the default for a new book): the nearest hue to the name that no other book uses.
  // The chosen hue is stored, so it never changes later when other books are added or removed.
  const [pickedHue, setPickedHue] = useState<number | null>(initial ? initial.hue : null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Focus after the sheet has finished sliding in; focusing during the animation makes mobile browsers jump.
  useEffect(() => {
    if (book) return;
    const t = window.setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 380);
    return () => window.clearTimeout(t);
  }, [book]);

  const icon = pickedIcon ?? suggestIcon(name);
  const autoHue = pickAutoHue(name || "book", usedHues);
  const hue = pickedHue ?? autoHue;
  const valid = name.trim().length > 0;

  function save() {
    if (valid) onSave({ name: name.trim(), icon, color: hue });
  }

  return (
    <Sheet onClose={onClose}>
      <div className="space-y-4 px-5 pb-5 pt-1">
        <h2 className="text-base font-bold text-fg">{book ? "Edit book" : "New book"}</h2>

        <div className="flex items-center gap-3">
          <BookAvatar book={{ name }} icon={icon} hue={hue} size={44} />
          <div className="min-w-0 flex-1">
            <label htmlFor="book-name" className="sr-only">
              Name
            </label>
            <input
              id="book-name"
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder="Name, e.g. Personal"
              maxLength={100}
              className="w-full rounded-xl border border-border/10 bg-surface-2 px-3 py-2.5 text-base text-fg outline-none placeholder:text-fg-muted focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
          </div>
        </div>

        <div>
          <span id="icon-label" className={labelCls}>
            Icon
          </span>
          <div role="radiogroup" aria-labelledby="icon-label" className="grid grid-cols-8 gap-1.5">
            {ICON_KEYS.map((key) => {
              const selected = icon === key;
              return (
                <button
                  key={key}
                  role="radio"
                  aria-checked={selected}
                  aria-label={key}
                  onClick={() => setPickedIcon(key)}
                  className={`press flex aspect-square items-center justify-center rounded-lg ${
                    selected ? "bg-brand-solid text-on-brand" : "bg-surface-2 text-fg-muted"
                  }`}
                >
                  <IconGlyph icon={key} size={18} />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span id="color-label" className={labelCls}>
            Color
          </span>
          <div role="radiogroup" aria-labelledby="color-label" className="flex flex-wrap items-center gap-x-2.5 gap-y-2.5">
            <button
              role="radio"
              aria-checked={pickedHue === null}
              onClick={() => setPickedHue(null)}
              className={`press flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold ${
                pickedHue === null ? "border-fg bg-surface text-fg" : "border-border/15 bg-surface text-fg-muted"
              }`}
            >
              <span className="book-swatch h-3 w-3 rounded-full" style={{ "--h": autoHue } as React.CSSProperties} />
              Auto
            </button>
            {SWATCH_HUES.map((h) => {
              const selected = pickedHue === h;
              return (
                <button
                  key={h}
                  role="radio"
                  aria-checked={selected}
                  aria-label={`Color ${h}`}
                  onClick={() => setPickedHue(h)}
                  className={`press book-swatch relative flex h-7 w-7 items-center justify-center rounded-full before:absolute before:-inset-1 before:content-[''] ${
                    selected ? "ring-2 ring-fg ring-offset-2 ring-offset-surface" : ""
                  }`}
                  style={{ "--h": h } as React.CSSProperties}
                >
                  {selected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="book-swatch h-5 w-5 flex-none rounded-full" style={{ "--h": hue } as React.CSSProperties} aria-hidden="true" />
            <div className="flex h-8 flex-1 items-center">
              <input
                type="range"
                min={0}
                max={359}
                value={hue}
                aria-label="Custom color"
                onChange={(e) => setPickedHue(Number(e.target.value))}
                className="hue-slider"
              />
            </div>
          </div>
        </div>

        <button
          onClick={save}
          disabled={!valid}
          className="press w-full rounded-xl bg-brand-solid py-2.5 text-sm font-bold text-on-brand disabled:opacity-50"
        >
          {book ? "Save changes" : "Create book"}
        </button>
      </div>
    </Sheet>
  );
}
