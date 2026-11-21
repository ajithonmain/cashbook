import type { ReactNode } from "react";

export function Group({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <section className="mb-4">
      {label && <h2 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.6px] text-fg-muted">{label}</h2>}
      <div className="divide-y divide-border/10 overflow-hidden rounded-2xl border border-border/10 bg-surface px-4 shadow-card">
        {children}
      </div>
    </section>
  );
}

interface RowProps {
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

const base = "flex min-h-[46px] w-full items-center justify-between gap-3 py-2 text-left";

export function Row({ title, sub, right, onClick, danger }: RowProps) {
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-semibold [overflow-wrap:anywhere] ${danger ? "text-out" : "text-fg"}`}>{title}</span>
        {sub && <span className="block text-[11px] leading-snug text-fg-muted">{sub}</span>}
      </span>
      {right}
    </>
  );
  return onClick ? (
    <button onClick={onClick} className={`press ${base}`}>
      {body}
    </button>
  ) : (
    <div className={base}>{body}</div>
  );
}

/** Small rounded button. The invisible pseudo-element widens the tap area to 44px. */
export function PillButton({
  children,
  onClick,
  disabled,
  solid,
  danger,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  solid?: boolean;
  danger?: boolean;
}) {
  const tone = solid
    ? "border-transparent bg-brand-solid text-on-brand"
    : danger
    ? "border-border/15 bg-surface text-out"
    : "border-border/15 bg-surface text-fg";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`press relative h-8 flex-none rounded-full border px-3 text-xs font-semibold before:absolute before:-inset-y-1.5 before:inset-x-0 before:content-[''] disabled:opacity-45 ${tone}`}
    >
      {children}
    </button>
  );
}

export function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-none text-fg-muted" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
