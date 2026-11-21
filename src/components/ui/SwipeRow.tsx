import { useRef, useState, type ReactNode } from "react";

interface SwipeRowProps {
  children: ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
}

const OPEN_X = -88;
const DRAG_THRESHOLD = 6;

export default function SwipeRow({ children, onDelete, deleteLabel = "Delete" }: SwipeRowProps) {
  const [x, setX] = useState(0);
  const dragging = useRef(false);
  const horizontalLock = useRef<boolean | null>(null);
  const start = useRef({ x: 0, y: 0, originX: 0 });

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    horizontalLock.current = null;
    start.current = { x: e.clientX, y: e.clientY, originX: x };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;

    if (horizontalLock.current === null) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      horizontalLock.current = Math.abs(dx) > Math.abs(dy);
      if (!horizontalLock.current) {
        dragging.current = false;
        return;
      }
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (!horizontalLock.current) return;

    const next = Math.min(0, Math.max(OPEN_X * 1.15, start.current.originX + dx));
    setX(next);
  }

  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    if (x < OPEN_X / 2) setX(OPEN_X);
    else setX(0);
  }

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 flex w-[88px] items-stretch">
        <button
          onClick={() => {
            onDelete();
            setX(0);
          }}
          aria-label={deleteLabel}
          className="press flex w-full items-center justify-center bg-out text-xs font-bold text-white"
        >
          {deleteLabel}
        </button>
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          transform: `translateX(${x}px)`,
          transition: dragging.current ? "none" : "transform 220ms cubic-bezier(0.19,1,0.22,1)",
          touchAction: "pan-y",
        }}
        className="relative bg-surface"
      >
        {children}
      </div>
    </div>
  );
}
