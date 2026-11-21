type ToastVariant = "default" | "success" | "error";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  /** True during the exit animation, just before removal. */
  leaving?: boolean;
}

type Listener = (toasts: ToastItem[]) => void;

const EXIT_MS = 220;
let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l([...toasts]);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener([...toasts]);
  return () => listeners.delete(listener);
}

export function dismissToast(id: string): void {
  if (!toasts.some((t) => t.id === id && !t.leaving)) return;
  toasts = toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t));
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, EXIT_MS);
}

export function showToast(
  message: string,
  opts: { variant?: ToastVariant; durationMs?: number; actionLabel?: string; onAction?: () => void } = {}
): void {
  const id = crypto.randomUUID();
  toasts = [...toasts, { id, message, variant: opts.variant ?? "default", actionLabel: opts.actionLabel, onAction: opts.onAction }];
  emit();
  setTimeout(() => dismissToast(id), opts.durationMs ?? 3500);
}
