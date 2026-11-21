import { useEffect, useState } from "react";
import { subscribe, dismissToast, type ToastItem } from "../../lib/toast";

const TONE = { success: "text-in", error: "text-out", default: "text-fg" } as const;

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => subscribe(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[1000] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex w-full max-w-sm items-center justify-between gap-3 rounded-2xl border border-border/10 bg-surface-2 px-4 py-2.5 shadow-sheet ${TONE[t.variant]}`}
          style={
            t.leaving
              ? { opacity: 0, transform: "translateY(10px) scale(0.98)", transition: "opacity 220ms var(--ease-out), transform 220ms var(--ease-out)" }
              : { animation: "toast-in 280ms var(--ease-out)" }
          }
        >
          <span className="text-sm font-medium">{t.message}</span>
          {t.actionLabel && (
            <button
              onClick={() => {
                t.onAction?.();
                dismissToast(t.id);
              }}
              className="press flex-none text-sm font-bold text-fg"
            >
              {t.actionLabel}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
