import { useState } from "react";
import { applyUpdate, usePwa } from "../../lib/pwa";

export default function UpdateBanner() {
  const { needRefresh } = usePwa();
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!needRefresh || dismissed) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-[calc(0.5rem+env(safe-area-inset-top))] z-[500] mx-auto flex w-[calc(100%-2rem)] max-w-sm items-center justify-between gap-2 rounded-2xl border border-border/10 bg-surface-2/95 py-2 pl-4 pr-2 shadow-card backdrop-blur-md"
      style={{ animation: "backdrop-in 200ms ease-out" }}
    >
      <span className="text-sm font-medium text-fg">New version available</span>
      <span className="flex items-center gap-1">
        <button onClick={() => setDismissed(true)} className="press rounded-lg px-3 py-2 text-xs font-semibold text-fg-muted">
          Later
        </button>
        <button
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void applyUpdate();
          }}
          className="press rounded-lg bg-brand-solid px-3 py-2 text-xs font-bold text-on-brand disabled:opacity-60"
        >
          {busy ? "Updating..." : "Update"}
        </button>
      </span>
    </div>
  );
}
