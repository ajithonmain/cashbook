import { useRef, useState, type ReactNode } from "react";

interface SheetProps {
  onClose: () => void;
  children: ReactNode;
  accentClassName?: string;
}

const CLOSE_THRESHOLD = 120;

export default function Sheet({ onClose, children, accentClassName }: SheetProps) {
  const [dragY, setDragY] = useState(0);
  const [closing, setClosing] = useState(false);
  const dragging = useRef(false);
  const startY = useRef(0);

  function handleClose() {
    setClosing(true);
    setTimeout(onClose, 180);
  }

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    startY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const delta = e.clientY - startY.current;
    if (delta > 0) setDragY(delta);
  }

  function onPointerUp() {
    dragging.current = false;
    if (dragY > CLOSE_THRESHOLD) {
      handleClose();
    } else {
      setDragY(0);
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center sm:items-center"
      style={{ animation: `${closing ? "backdrop-out" : "backdrop-in"} 200ms ease-out forwards` }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className="safe-bottom relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-surface shadow-sheet sm:max-w-md sm:rounded-3xl"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: dragging.current ? "none" : "transform 220ms cubic-bezier(0.34,1.56,0.64,1)",
          animation: closing ? "sheet-out 180ms ease-in forwards" : "sheet-in 260ms cubic-bezier(0.19,1,0.22,1)",
        }}
      >
        <div
          className="flex cursor-grab touch-none justify-center py-2.5 active:cursor-grabbing sm:hidden"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div className={`h-1.5 w-10 rounded-full ${accentClassName ?? "bg-white/20"}`} />
        </div>
        {children}
      </div>
    </div>
  );
}
