import type { CSSProperties, ReactNode } from "react";
import type { Book } from "../lib/types";
import { styleOf, type IconKey } from "../lib/bookStyle";

const ICONS: Record<IconKey, ReactNode> = {
  book: <path d="M6 4h10a2 2 0 0 1 2 2v14l-7-3-7 3V6a2 2 0 0 1 2-2Z" />,
  wallet: (
    <>
      <path d="M4 8V7a2 2 0 0 1 2-2h10a1 1 0 0 1 1 1v2" />
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M16.5 14h2" />
    </>
  ),
  store: (
    <>
      <path d="M4 10v10h16V10" />
      <path d="M3 10l2-5h14l2 5" />
      <path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  home: (
    <>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v10h12V10" />
    </>
  ),
  car: (
    <>
      <path d="M5 12l1.6-4.2A2 2 0 0 1 8.5 6.5h7a2 2 0 0 1 1.9 1.3L19 12" />
      <rect x="3" y="12" width="18" height="5.5" rx="2" />
      <path d="M7 17.5V20M17 17.5V20M7 14.75h.01M17 14.75h.01" />
    </>
  ),
  plane: (
    <>
      <path d="M21 3L3 11l7 2 2 7 9-17Z" />
      <path d="M10 13l11-10" />
    </>
  ),
  bag: (
    <>
      <path d="M6 8h12l1 12H5L6 8Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </>
  ),
  food: (
    <>
      <path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10" />
      <path d="M17 3c-2 2-2 6 0 8v10" />
    </>
  ),
  heart: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />,
  briefcase: (
    <>
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 13h16" />
    </>
  ),
  cap: (
    <>
      <path d="M3 9l9-4 9 4-9 4-9-4Z" />
      <path d="M7 11v5c2 2 8 2 10 0v-5" />
    </>
  ),
  gift: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="1" />
      <path d="M12 9v11M3 9h18M12 9c-2-4-6-3-5 0M12 9c2-4 6-3 5 0" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="12" cy="7" rx="7" ry="3" />
      <path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7" />
      <path d="M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
    </>
  ),
  bolt: <path d="M13 3L5 13h6l-1 8 8-10h-6l1-8Z" />,
  phone: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  chart: <path d="M5 20V10M12 20V4M19 20v-7" />,
  cart: (
    <>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4h2.5l2.2 11h10.6l2-8H6.5" />
    </>
  ),
  coffee: (
    <>
      <path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9Z" />
      <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8 3v2M12 3v2" />
    </>
  ),
  bus: (
    <>
      <rect x="4" y="3.5" width="16" height="14" rx="3" />
      <path d="M4 11h16M8 21v-3.5M16 21v-3.5M8 14.5h.01M16 14.5h.01" />
    </>
  ),
  fuel: (
    <>
      <path d="M5 20V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v15" />
      <path d="M4 20h11M7 8h5" />
      <path d="M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3" />
    </>
  ),
  pill: (
    <>
      <rect x="3.5" y="9" width="17" height="6" rx="3" transform="rotate(-45 12 12)" />
      <path d="M9.9 9.9l4.2 4.2" />
    </>
  ),
  paw: (
    <>
      <circle cx="7" cy="10" r="1.8" />
      <circle cx="17" cy="10" r="1.8" />
      <circle cx="10.5" cy="6" r="1.8" />
      <circle cx="13.5" cy="6" r="1.8" />
      <path d="M12 12c-3 0-5.5 2.7-5 5.2.3 1.7 2 2.3 3.5 2 1-.2 1.2-.5 1.5-.5s.5.3 1.5.5c1.5.3 3.2-.3 3.5-2 .5-2.5-2-5.2-5-5.2Z" />
    </>
  ),
  tv: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M9 21h6M12 18v3" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V6l10-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </>
  ),
  dumbbell: <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />,
  wrench: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
  ),
  camera: (
    <>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  laptop: (
    <>
      <rect x="5" y="5" width="14" height="10" rx="1.5" />
      <path d="M3 19h18l-1.5-4h-15L3 19Z" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21V3Z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3 10h18M7 15h3" />
    </>
  ),
  piggy: (
    <>
      <path d="M5 12c0-3 3-5 7-5s7 2 7 5c0 1.8-.8 3.2-2 4v2.5h-3V17h-4v1.5H7V16c-1.2-.8-2-2.2-2-4Z" />
      <path d="M19.5 11.5H21v3h-1.5M15 11h.01M10 8.5h3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
};

export function IconGlyph({ icon, size }: { icon: IconKey; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[icon]}
    </svg>
  );
}

interface BookAvatarProps {
  book: Pick<Book, "name" | "icon" | "color">;
  size?: number;
  /** Override the stored look, for live previews in the editor. */
  icon?: IconKey;
  hue?: number;
}

export default function BookAvatar({ book, size = 32, icon, hue }: BookAvatarProps) {
  const resolved = styleOf(book);
  return (
    <span className="book-avatar" style={{ "--h": hue ?? resolved.hue, width: size, height: size } as CSSProperties}>
      <IconGlyph icon={icon ?? resolved.icon} size={Math.round(size * 0.5)} />
    </span>
  );
}
