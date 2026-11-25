import { useState } from "react";
import type { ImportEntry, SkippedRow } from "../lib/csvImport";
import { formatAmount } from "../lib/format";
import { totalsOf } from "../lib/totals";
import Sheet from "./ui/Sheet";

export interface ImportPreview {
  fileName: string;
  fresh: ImportEntry[];
  duplicates: number;
  skipped: SkippedRow[];
}

interface ImportSheetProps {
  preview: ImportPreview;
  bookName: string;
  onClose: () => void;
  onImport: () => Promise<void>;
}

const MAX_SKIPPED_SHOWN = 20;

export default function ImportSheet({ preview, bookName, onClose, onImport }: ImportSheetProps) {
  const [busy, setBusy] = useState(false);
  const { fresh, duplicates, skipped, fileName } = preview;
  const { totalIn, totalOut, net } = totalsOf(fresh);
  const count = `${fresh.length} ${fresh.length === 1 ? "entry" : "entries"}`;

  return (
    <Sheet onClose={onClose}>
      <div className="space-y-3 px-5 pb-6 pt-1">
        <div>
          <h2 className="text-base font-bold text-fg">Import CSV</h2>
          <p className="truncate text-xs text-fg-muted">
            {fileName} into {bookName}
          </p>
        </div>

        <dl className="divide-y divide-border/10 rounded-2xl border border-border/10 bg-surface-2 px-3.5 text-sm">
          {[
            { label: "New entries", value: String(fresh.length), tone: "text-fg" },
            { label: "Cash in", value: formatAmount(totalIn), tone: "text-in" },
            { label: "Cash out", value: formatAmount(totalOut), tone: "text-out" },
            { label: "Net", value: formatAmount(net), tone: net < 0 ? "text-out" : "text-fg" },
          ].map((row) => (
            <div key={row.label} className="flex justify-between gap-3 py-2">
              <dt className="text-fg-muted">{row.label}</dt>
              <dd className={`tabular font-semibold ${row.tone}`}>{row.value}</dd>
            </div>
          ))}
        </dl>

        {duplicates > 0 && (
          <p className="text-xs text-fg-muted">
            {duplicates} already in this book and will not be added again.
          </p>
        )}

        {skipped.length > 0 && (
          <div className="text-xs text-fg-muted">
            <p className="font-semibold">
              {skipped.length} {skipped.length === 1 ? "row" : "rows"} cannot be imported
            </p>
            <ul className="mt-1 max-h-28 overflow-y-auto">
              {skipped.slice(0, MAX_SKIPPED_SHOWN).map((s) => (
                <li key={s.row}>
                  Row {s.row}: {s.reason}
                </li>
              ))}
              {skipped.length > MAX_SKIPPED_SHOWN && <li>and {skipped.length - MAX_SKIPPED_SHOWN} more</li>}
            </ul>
          </div>
        )}

        <button
          disabled={busy || fresh.length === 0}
          onClick={() => {
            setBusy(true);
            void onImport().finally(() => setBusy(false));
          }}
          className="press w-full rounded-xl bg-brand-solid py-3 text-sm font-bold text-on-brand disabled:opacity-40"
        >
          {fresh.length === 0 ? "Nothing new to import" : busy ? "Importing" : `Import ${count}`}
        </button>
      </div>
    </Sheet>
  );
}
