type ToastVariant = "default" | "success" | "error";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
}

type Listener = (toasts: ToastItem[]) => void;

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

export function showToast(
  message: string,
  opts: { variant?: ToastVariant; durationMs?: number; actionLabel?: string; onAction?: () => void } = {}
): void {
  const id = crypto.randomUUID();
  toasts = [...toasts, { id, message, variant: opts.variant ?? "default", actionLabel: opts.actionLabel, onAction: opts.onAction }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, opts.durationMs ?? 3500);
}

export function dismissToast(id: string): void {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}
