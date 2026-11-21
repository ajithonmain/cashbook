import type { ReactNode } from "react";

interface TopBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}

export default function TopBar({ title, subtitle, onBack, right }: TopBarProps) {
  return (
    <div className="safe-top sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border/10 bg-bg/80 px-4 py-3 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-2">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Back"
            className="press flex h-10 w-10 flex-none items-center justify-center rounded-full text-fg active:bg-white/5"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-fg">{title}</h1>
          {subtitle && <p className="truncate text-xs text-fg-muted">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="flex flex-none items-center gap-1">{right}</div>}
    </div>
  );
}
