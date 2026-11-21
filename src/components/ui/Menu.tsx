import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface MenuProps {
  /** The button that opened the menu; the menu is positioned against it. */
  anchor: HTMLElement;
  onClose: () => void;
  children: ReactNode;
}

const MARGIN = 12;
const GAP = 4;

/**
 * Dropdown rendered in a portal with fixed positioning, so it can never be clipped by a card or list
 * that uses overflow-hidden. It right-aligns to the anchor and flips above it when there is no room below.
 */
export default function Menu({ anchor, onClose, children }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number; up: boolean } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const a = anchor.getBoundingClientRect();
    const h = el.offsetHeight;
    const spaceBelow = window.innerHeight - a.bottom - MARGIN;
    const up = h + GAP > spaceBelow && a.top - MARGIN > spaceBelow;
    setPos({
      top: up ? Math.max(MARGIN, a.top - h - GAP) : a.bottom + GAP,
      right: Math.max(MARGIN, window.innerWidth - a.right),
      up,
    });
  }, [anchor]);

  useLayoutEffect(() => {
    const close = () => onClose();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[65]" onClick={onClose}>
      <div
        ref={ref}
        role="menu"
        onClick={(e) => e.stopPropagation()}
        className="pop absolute w-44 overflow-hidden rounded-xl border border-border/10 bg-surface shadow-sheet"
        style={{
          top: pos?.top ?? 0,
          right: pos?.right ?? MARGIN,
          // Measured first, then shown, so the menu never flashes in the wrong place.
          visibility: pos ? "visible" : "hidden",
          transformOrigin: pos?.up ? "bottom right" : "top right",
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export function MenuItem({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: ReactNode }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`block w-full px-4 py-2.5 text-left text-sm font-medium active:bg-fg/5 ${danger ? "text-out" : "text-fg"}`}
    >
      {children}
    </button>
  );
}
