import { useEffect, useState } from "react";
import { subscribe, dismissToast, type ToastItem } from "../../lib/toast";

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => subscribe(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-[1000] flex flex-col items-center gap-2 px-4 pb-24"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex w-full max-w-sm items-center justify-between gap-3 rounded-2xl border border-border/10 px-4 py-3 shadow-card backdrop-blur-md ${
            t.variant === "success"
              ? "bg-in/15 text-in"
              : t.variant === "error"
              ? "bg-out/15 text-out"
              : "bg-surface-2/95 text-fg"
          }`}
          style={{ animation: "backdrop-in 200ms ease-out" }}
        >
          <span className="text-sm font-medium">{t.message}</span>
          {t.actionLabel && (
            <button
              onClick={() => {
                t.onAction?.();
                dismissToast(t.id);
              }}
              className="press flex-none text-sm font-bold text-brand"
            >
              {t.actionLabel}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
