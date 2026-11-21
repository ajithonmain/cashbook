import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface SheetProps {
  onClose: () => void;
  children: ReactNode;
}

const CLOSE_THRESHOLD = 110;
const EXIT_MS = 240;

/**
 * Bottom sheet rendered in a portal on document.body so it always stacks above the dock and any
 * screen. Layer order: dock 40, book screen 50, sheet 60, confirm 70, update banner 500, toast 1000.
 *
 * Motion: enters with a keyframe slide (no overshoot), follows the finger while dragging, and exits by
 * transitioning from wherever it currently is, so a dragged-then-released sheet never jumps back first.
 */
export default function Sheet({ onClose, children }: SheetProps) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const startY = useRef(0);
  const closeTimer = useRef<number>();

  function handleClose() {
    if (closing) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, EXIT_MS);
  }

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(closeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    setDragging(true);
    startY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const delta = e.clientY - startY.current;
    // Resist upward drags instead of moving the sheet away from the bottom edge.
    setDragY(delta > 0 ? delta : delta * 0.15);
  }

  function onPointerUp() {
    setDragging(false);
    if (dragY > CLOSE_THRESHOLD) handleClose();
    else setDragY(0);
  }

  const offset = closing ? "100%" : `${Math.max(dragY, -12)}px`;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
        style={{
          opacity: closing ? 0 : 1,
          transition: `opacity ${EXIT_MS}ms var(--ease-out)`,
          animation: "backdrop-in 260ms var(--ease-out)",
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl bg-surface pb-[env(safe-area-inset-bottom)] shadow-sheet will-change-transform sm:max-w-md sm:rounded-3xl"
        style={{
          transform: `translateY(${offset})`,
          transition: dragging ? "none" : `transform ${closing ? EXIT_MS : 280}ms ${closing ? "var(--ease-in)" : "var(--ease-out)"}`,
          animation: "sheet-in 360ms var(--ease-out)",
        }}
      >
        <div
          className="flex cursor-grab touch-none justify-center py-2 active:cursor-grabbing sm:hidden"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="h-1.5 w-10 rounded-full bg-fg/20" />
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
