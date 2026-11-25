import { useState } from "react";
import { formatDateShort } from "../../lib/format";
import DatePicker from "./DatePicker";

interface DateFieldProps {
  id: string;
  label: string;
  value?: number;
  onChange: (day: number) => void;
  className: string;
}

/** A field-shaped button that opens the calendar. Pair it with a label whose htmlFor is `id`. */
export default function DateField({ id, label, value, onChange, className }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const text = value === undefined ? "Select date" : formatDateShort(value);

  return (
    <>
      <button
        id={id}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${label}: ${text}`}
        aria-haspopup="dialog"
        className={`${className} flex items-center gap-2 text-left`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="flex-none text-fg-muted">
          <rect x="4" y="5" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4 10h16M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className={`tabular truncate ${value === undefined ? "text-fg-muted" : ""}`}>{text}</span>
      </button>
      {open && (
        <DatePicker
          value={value}
          onClose={() => setOpen(false)}
          onSelect={(day) => {
            onChange(day);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
