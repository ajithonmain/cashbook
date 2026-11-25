import { useEffect, useRef, useState } from "react";
import type { Book, EntryType, Transaction } from "../lib/types";
import { settingsOf } from "../lib/bookSettings";
import { combineDayAndTime, startOfDay, toTimeValue } from "../lib/calendar";
import DateField from "./ui/DateField";
import Sheet from "./ui/Sheet";

interface TransactionFormProps {
  book: Book;
  type: EntryType;
  initial?: Transaction;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    category: string;
    party: string;
    paymentMode: string;
    remarks: string;
    customFields?: Record<string, string>;
    occurredAt: number;
  }) => void;
  onDelete?: () => void;
}

const inputCls =
  "w-full rounded-xl border border-border/10 bg-surface-2 px-3 py-2.5 text-base text-fg outline-none placeholder:text-fg-muted focus:border-brand focus:ring-2 focus:ring-brand/30";
const labelCls = "mb-1.5 block text-xs font-semibold text-fg-muted";

export default function TransactionForm({ book, type, initial, onClose, onSubmit, onDelete }: TransactionFormProps) {
  const settings = settingsOf(book);
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState(initial?.category ?? settings.categories[0] ?? "");
  const [party, setParty] = useState(initial?.party ?? "");
  const [paymentMode, setPaymentMode] = useState(initial?.paymentMode ?? settings.paymentModes[0] ?? "");
  const [remarks, setRemarks] = useState(initial?.remarks ?? "");
  const [customValues, setCustomValues] = useState<Record<string, string>>(initial?.customFields ?? {});
  const [openedAt] = useState(() => initial?.occurredAt ?? Date.now());
  const [day, setDay] = useState(() => startOfDay(openedAt));
  const [time, setTime] = useState(() => toTimeValue(openedAt));
  const [error, setError] = useState("");
  const [timeError, setTimeError] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  // Focus after the sheet has finished sliding in; focusing during the animation makes mobile browsers jump.
  useEffect(() => {
    const t = window.setTimeout(() => amountRef.current?.focus({ preventScroll: true }), 380);
    return () => window.clearTimeout(t);
  }, []);

  function submit() {
    const amt = Number(amount);
    if (!amount || Number.isNaN(amt) || amt <= 0) {
      setError("Enter an amount greater than 0");
      return;
    }
    if (settings.categoryEnabled && settings.categoryRequired && !category) {
      setError("Category is required");
      return;
    }
    if (settings.paymentModeEnabled && settings.paymentModeRequired && !paymentMode) {
      setError("Payment mode is required");
      return;
    }
    if (settings.partyEnabled && settings.partyRequired && !party.trim()) {
      setError("Party is required");
      return;
    }
    const occurredAt = combineDayAndTime(day, time);
    if (occurredAt === null) {
      setTimeError("Enter a time");
      return;
    }
    onSubmit({
      amount: amt,
      category: settings.categoryEnabled ? category : "",
      party: settings.partyEnabled ? party.trim() : "",
      paymentMode: settings.paymentModeEnabled ? paymentMode : "",
      remarks: remarks.trim(),
      customFields: settings.customFields.length > 0 ? customValues : undefined,
      occurredAt,
    });
  }

  const isIn = type === "in";

  return (
    <Sheet onClose={onClose}>
      <div className="space-y-4 px-5 pb-5 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-fg">
            {initial ? "Edit entry" : isIn ? "Cash In" : "Cash Out"}
          </h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${isIn ? "bg-in/15 text-in" : "bg-out/15 text-out"}`}
          >
            {isIn ? "Money in" : "Money out"}
          </span>
        </div>

        <div>
          <label htmlFor="txn-amount" className={labelCls}>
            Amount
          </label>
          <input
            id="txn-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError("");
            }}
            placeholder="0"
            ref={amountRef}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "txn-amount-error" : undefined}
            className={`${inputCls} tabular text-2xl font-bold ${isIn ? "text-in" : "text-out"}`}
          />
          {error && (
            <p id="txn-amount-error" className="mt-1.5 text-sm text-out">
              {error}
            </p>
          )}
        </div>

        {(settings.categoryEnabled || settings.paymentModeEnabled) && (
          <div className="grid grid-cols-2 gap-3">
            {settings.categoryEnabled && (
              <div>
                <label htmlFor="txn-category" className={labelCls}>
                  Category{settings.categoryRequired ? " *" : ""}
                </label>
                <select id="txn-category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                  {!settings.categoryRequired && <option value="">No category</option>}
                  {settings.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {settings.paymentModeEnabled && (
              <div>
                <label htmlFor="txn-mode" className={labelCls}>
                  Payment mode{settings.paymentModeRequired ? " *" : ""}
                </label>
                <select id="txn-mode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className={inputCls}>
                  {!settings.paymentModeRequired && <option value="">No payment mode</option>}
                  {settings.paymentModes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {settings.partyEnabled && (
          <div>
            <label htmlFor="txn-party" className={labelCls}>
              Party name{settings.partyRequired ? " *" : ""}
            </label>
            <input id="txn-party" value={party} onChange={(e) => setParty(e.target.value)} placeholder="Who was this with?" className={inputCls} />
          </div>
        )}

        <div>
          <label htmlFor="txn-remarks" className={labelCls}>
            Remarks
          </label>
          <input id="txn-remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Notes" className={inputCls} />
        </div>

        {settings.customFields.map((field) => (
          <div key={field.id}>
            <label htmlFor={`txn-custom-${field.id}`} className={labelCls}>
              {field.name}
            </label>
            <input
              id={`txn-custom-${field.id}`}
              value={customValues[field.id] ?? ""}
              onChange={(e) => setCustomValues({ ...customValues, [field.id]: e.target.value })}
              className={inputCls}
            />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="txn-date" className={labelCls}>
              Date
            </label>
            <DateField id="txn-date" label="Date" value={day} onChange={setDay} className={`${inputCls} h-12`} />
          </div>
          <div>
            <label htmlFor="txn-time" className={labelCls}>
              Time
            </label>
            <input
              id="txn-time"
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                setTimeError("");
              }}
              aria-invalid={Boolean(timeError)}
              className={`${inputCls} h-12`}
            />
            {timeError && (
              <p role="alert" className="mt-1.5 text-sm text-out">
                {timeError}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={submit}
          className={`press w-full rounded-xl py-3.5 text-base font-extrabold text-on-in ${isIn ? "bg-in-solid" : "bg-out-solid"}`}
        >
          {initial ? "Save changes" : isIn ? "Save Cash In" : "Save Cash Out"}
        </button>

        {onDelete && (
          <button onClick={onDelete} className="press w-full rounded-xl border border-out/40 py-3 text-sm font-bold text-out">
            Delete entry
          </button>
        )}
      </div>
    </Sheet>
  );
}
