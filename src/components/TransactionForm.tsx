import { useState } from "react";
import type { EntryType, Transaction } from "../lib/types";
import { CATEGORIES_IN, CATEGORIES_OUT, PAYMENT_MODES } from "../lib/types";
import { toDatetimeLocalValue } from "../lib/format";
import Sheet from "./ui/Sheet";

interface TransactionFormProps {
  type: EntryType;
  initial?: Transaction;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    category: string;
    party: string;
    paymentMode: string;
    remarks: string;
    occurredAt: number;
  }) => void;
  onDelete?: () => void;
}

const inputCls =
  "w-full rounded-xl border border-border/10 bg-surface-2 px-3.5 py-3 text-base text-fg outline-none placeholder:text-fg-muted focus:border-brand focus:ring-2 focus:ring-brand/30";
const labelCls = "mb-1.5 block text-xs font-semibold text-fg-muted";

export default function TransactionForm({ type, initial, onClose, onSubmit, onDelete }: TransactionFormProps) {
  const categories = type === "in" ? CATEGORIES_IN : CATEGORIES_OUT;
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState(initial?.category ?? categories[0]);
  const [party, setParty] = useState(initial?.party ?? "");
  const [paymentMode, setPaymentMode] = useState(initial?.paymentMode ?? PAYMENT_MODES[0]);
  const [remarks, setRemarks] = useState(initial?.remarks ?? "");
  const [occurredAt, setOccurredAt] = useState(toDatetimeLocalValue(initial?.occurredAt ?? Date.now()));
  const [error, setError] = useState("");

  function submit() {
    const amt = Number(amount);
    if (!amount || Number.isNaN(amt) || amt <= 0) {
      setError("Enter an amount greater than 0");
      return;
    }
    onSubmit({
      amount: amt,
      category,
      party: party.trim(),
      paymentMode,
      remarks: remarks.trim(),
      occurredAt: new Date(occurredAt).getTime(),
    });
  }

  const isIn = type === "in";

  return (
    <Sheet onClose={onClose}>
      <div className="space-y-4 px-5 pb-5 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-fg">
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
            autoFocus
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "txn-amount-error" : undefined}
            className={`${inputCls} tabular text-3xl font-extrabold ${isIn ? "text-in" : "text-out"}`}
          />
          {error && (
            <p id="txn-amount-error" className="mt-1.5 text-sm text-out">
              {error}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="txn-category" className={labelCls}>
              Category
            </label>
            <select id="txn-category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="txn-mode" className={labelCls}>
              Payment mode
            </label>
            <select id="txn-mode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className={inputCls}>
              {PAYMENT_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="txn-party" className={labelCls}>
            Party name
          </label>
          <input id="txn-party" value={party} onChange={(e) => setParty(e.target.value)} placeholder="Who was this with?" className={inputCls} />
        </div>

        <div>
          <label htmlFor="txn-remarks" className={labelCls}>
            Remarks
          </label>
          <input id="txn-remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Notes" className={inputCls} />
        </div>

        <div>
          <label htmlFor="txn-date" className={labelCls}>
            Date and time
          </label>
          <input id="txn-date" type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} className={inputCls} />
        </div>

        <button
          onClick={submit}
          className={`press w-full rounded-xl py-3.5 text-base font-extrabold text-bg ${isIn ? "bg-in" : "bg-out"}`}
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
