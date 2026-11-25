import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { addMonths, monthGrid, monthOf, startOfDay, withYear } from "../../lib/calendar";

interface DatePickerProps {
  /** Local midnight of the selected day; today when omitted. */
  value?: number;
  onSelect: (day: number) => void;
  onClose: () => void;
}

const EXIT_MS = 160;
const FIRST_YEAR = 1970;
const LAST_YEAR = 2099;
const YEARS = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const headline = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
const monthTitle = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const dayLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

/**
 * Calendar dialog: selected date in a filled header, one month at a time, Cancel and OK. Sits above
 * sheets (layer 70) because it is opened from inside them.
 */
export default function DatePicker({ value, onSelect, onClose }: DatePickerProps) {
  const [selected, setSelected] = useState(() => startOfDay(value ?? Date.now()));
  const [shown, setShown] = useState(() => monthOf(selected));
  const [pickingYear, setPickingYear] = useState(false);
  const [closing, setClosing] = useState(false);
  const yearList = useRef<HTMLDivElement>(null);
  const today = startOfDay(Date.now());

  function finish(action: () => void) {
    if (closing) return;
    setClosing(true);
    window.setTimeout(action, EXIT_MS);
  }

  useEffect(() => {
    // Capture phase, so Escape closes only the calendar and not the sheet underneath.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  useLayoutEffect(() => {
    const list = yearList.current;
    const active = list?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (list && active) list.scrollTop = active.offsetTop - list.clientHeight / 2 + active.clientHeight / 2;
  }, [pickingYear]);

  const arrow = (delta: number, label: string, path: string) => (
    <button
      type="button"
      onClick={() => setShown(addMonths(shown, delta))}
      aria-label={label}
      className="press flex h-11 w-11 items-center justify-center rounded-full text-fg active:bg-fg/5"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d={path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Choose date">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => finish(onClose)}
        aria-hidden="true"
        style={{
          opacity: closing ? 0 : 1,
          transition: `opacity ${EXIT_MS}ms var(--ease-out)`,
          animation: "backdrop-in 200ms var(--ease-out)",
        }}
      />
      <div
        className="relative max-h-full w-full max-w-xs overflow-y-auto rounded-2xl border border-border/10 bg-surface shadow-sheet"
        style={{
          opacity: closing ? 0 : 1,
          transform: closing ? "scale(0.96)" : "scale(1)",
          transition: `opacity ${EXIT_MS}ms var(--ease-out), transform ${EXIT_MS}ms var(--ease-out)`,
          animation: "pop-in 220ms var(--ease-out)",
        }}
      >
        <div className="bg-brand-solid px-5 py-3.5 text-on-brand">
          <button
            type="button"
            onClick={() => setPickingYear((v) => !v)}
            aria-label={`Change year, ${new Date(selected).getFullYear()}`}
            aria-expanded={pickingYear}
            className="press -my-1 py-1 text-sm font-semibold opacity-75"
          >
            {new Date(selected).getFullYear()}
          </button>
          <p className="text-3xl font-bold tracking-tight" aria-live="polite">
            {headline.format(selected)}
          </p>
        </div>

        {pickingYear ? (
          <div ref={yearList} className="relative grid h-[20.25rem] grid-cols-3 content-start gap-1 overflow-y-auto p-3">
            {YEARS.map((year) => {
              const active = year === shown.year;
              return (
                <button
                  key={year}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    const next = withYear(new Date(shown.year, shown.month, new Date(selected).getDate()).getTime(), year);
                    setSelected(next);
                    setShown(monthOf(next));
                    setPickingYear(false);
                  }}
                  className={`press tabular h-11 rounded-full text-sm ${active ? "bg-brand-solid font-bold text-on-brand" : "text-fg active:bg-fg/5"}`}
                >
                  {year}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="h-[20.25rem] px-3 pt-1">
            <div className="flex items-center justify-between">
              {arrow(-1, "Previous month", "M15 18l-6-6 6-6")}
              <p className="text-sm font-bold text-fg" aria-live="polite">
                {monthTitle.format(new Date(shown.year, shown.month, 1))}
              </p>
              {arrow(1, "Next month", "M9 18l6-6-6-6")}
            </div>
            <div className="grid grid-cols-7">
              {WEEKDAYS.map((name) => (
                <abbr key={name} title={name} className="flex h-7 items-center justify-center text-xs text-fg-muted no-underline">
                  {name[0]}
                </abbr>
              ))}
              {monthGrid(shown).map((day, i) => {
                if (day === null) return <span key={`blank-${i}`} className="h-10" />;
                const ts = new Date(shown.year, shown.month, day).getTime();
                const active = ts === selected;
                return (
                  <button
                    key={ts}
                    type="button"
                    onClick={() => setSelected(ts)}
                    aria-label={dayLabel.format(ts)}
                    aria-pressed={active}
                    aria-current={ts === today ? "date" : undefined}
                    className="press tabular flex h-10 items-center justify-center text-sm"
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        active
                          ? "bg-brand-solid font-bold text-on-brand"
                          : ts === today
                            ? "border border-brand font-bold text-fg"
                            : "text-fg"
                      }`}
                    >
                      {day}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 px-3 pb-3 pt-1">
          <button
            type="button"
            onClick={() => finish(onClose)}
            className="press rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-fg-muted active:bg-fg/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => finish(() => onSelect(selected))}
            className="press rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-brand active:bg-fg/5"
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
