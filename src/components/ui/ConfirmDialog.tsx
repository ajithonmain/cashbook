interface ConfirmDialogProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6"
      style={{ animation: "backdrop-in 180ms ease-out" }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <div
        className="relative w-full max-w-xs rounded-2xl border border-border/10 bg-surface-2 p-5 shadow-card"
        style={{ animation: "sheet-in 200ms cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        <h2 id="confirm-title" className="text-base font-bold text-fg">
          {title}
        </h2>
        {description && <p className="mt-1.5 text-sm text-fg-muted">{description}</p>}
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="press flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-semibold text-fg"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`press flex-1 rounded-xl py-2.5 text-sm font-bold text-bg ${destructive ? "bg-out" : "bg-brand"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
