export type TabKey = "books" | "reports" | "settings";

interface BottomNavProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string; icon: JSX.Element }[] = [
  {
    key: "books",
    label: "Books",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 4h10a2 2 0 0 1 2 2v14l-7-3-7 3V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "reports",
    label: "Reports",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 20V10M12 20V4M19 20v-7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "settings",
    label: "Settings",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 7h9M17 7h3M4 17h3M11 17h9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        <circle cx="15" cy="7" r="2" stroke="currentColor" strokeWidth="1.9" />
        <circle cx="9" cy="17" r="2" stroke="currentColor" strokeWidth="1.9" />
      </svg>
    ),
  },
];

/**
 * Slim dock. Three equal cells never change size, a single pill slides between them, and the active
 * label expands in place, so switching tabs moves nothing else on the bar.
 */
export default function BottomNav({ active, onChange }: BottomNavProps) {
  const index = TABS.findIndex((t) => t.key === active);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 bg-dock pb-[env(safe-area-inset-bottom)]" aria-label="Primary">
      <div className="relative mx-auto grid max-w-md grid-cols-3 px-2 py-1">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-1 left-2 w-[calc((100%-1rem)/3)] px-2 py-1.5 will-change-transform"
          style={{
            transform: `translateX(${index * 100}%)`,
            transition: "transform 380ms var(--ease-out)",
          }}
        >
          <span className="block h-full rounded-full bg-dock-active" />
        </span>

        {TABS.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className={`press relative z-10 flex h-12 items-center justify-center transition-colors duration-300 ${
                isActive ? "text-dock-active-text" : "text-dock-text"
              }`}
            >
              {tab.icon}
              <span
                className="grid transition-[grid-template-columns,margin,opacity] duration-300 ease-out"
                style={{
                  gridTemplateColumns: isActive ? "1fr" : "0fr",
                  marginLeft: isActive ? 8 : 0,
                  opacity: isActive ? 1 : 0,
                }}
              >
                <span className="min-w-0 overflow-hidden whitespace-nowrap text-[13px] font-semibold">{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
