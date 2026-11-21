import { useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const EXIT_MS = 160;

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [closing, setClosing] = useState(false);

  function finish(action: () => void) {
    if (closing) return;
    setClosing(true);
    window.setTimeout(action, EXIT_MS);
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => finish(onCancel)}
        aria-hidden="true"
        style={{
          opacity: closing ? 0 : 1,
          transition: `opacity ${EXIT_MS}ms var(--ease-out)`,
          animation: "backdrop-in 200ms var(--ease-out)",
        }}
      />
      <div
        className="relative w-full max-w-xs rounded-2xl border border-border/10 bg-surface p-4 shadow-sheet"
        style={{
          opacity: closing ? 0 : 1,
          transform: closing ? "scale(0.96)" : "scale(1)",
          transition: `opacity ${EXIT_MS}ms var(--ease-out), transform ${EXIT_MS}ms var(--ease-out)`,
          animation: "pop-in 220ms var(--ease-out)",
        }}
      >
        <h2 id="confirm-title" className="text-sm font-bold text-fg">
          {title}
        </h2>
        {description && <p className="mt-1 text-xs leading-relaxed text-fg-muted">{description}</p>}
        <div className="mt-4 flex gap-2">
          <button onClick={() => finish(onCancel)} className="press flex-1 rounded-xl bg-fg/10 py-2.5 text-sm font-semibold text-fg">
            {cancelLabel}
          </button>
          <button
            onClick={() => finish(onConfirm)}
            className={`press flex-1 rounded-xl py-2.5 text-sm font-bold ${destructive ? "bg-out-solid text-on-out" : "bg-brand-solid text-on-brand"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
