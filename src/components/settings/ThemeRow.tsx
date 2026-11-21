import { setThemePreference, useThemePreference, type ThemePreference } from "../../lib/theme";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

/** Sliding segmented control (PocketDays pattern). */
export default function ThemeRow() {
  const current = useThemePreference();
  const index = Math.max(0, OPTIONS.findIndex((o) => o.value === current));

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className="relative flex gap-0.5 rounded-[18px] border border-border/10 bg-surface p-[3px]"
    >
      <span
        aria-hidden="true"
        className="absolute bottom-[3px] top-[3px] rounded-[15px] bg-brand-solid transition-transform duration-300 ease-out-expo"
        style={{
          left: 3,
          width: "calc((100% - 6px - 4px) / 3)",
          transform: `translateX(calc(${index} * (100% + 2px)))`,
        }}
      />
      {OPTIONS.map((o) => {
        const active = current === o.value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            onClick={() => setThemePreference(o.value)}
            className={`press relative min-h-9 flex-1 rounded-[15px] px-1 text-[13px] transition-colors duration-200 ${
              active ? "font-semibold text-on-brand" : "font-medium text-fg-muted"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
