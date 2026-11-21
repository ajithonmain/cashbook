import { useSyncExternalStore } from "react";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const KEY = "cashbook_theme";
const BAR_COLOR: Record<ResolvedTheme, string> = { light: "#F5F5F7", dark: "#0D0F10" };
const listeners = new Set<() => void>();
const media = window.matchMedia("(prefers-color-scheme: dark)");

function read(): ThemePreference {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // storage unavailable: fall back to system
  }
  return "system";
}

let preference = read();

export function resolve(pref: ThemePreference): ResolvedTheme {
  return pref === "system" ? (media.matches ? "dark" : "light") : pref;
}

function apply(animate = false) {
  const root = document.documentElement;
  if (animate) {
    root.classList.add("theme-transition");
    window.setTimeout(() => root.classList.remove("theme-transition"), 320);
  }
  const theme = resolve(preference);
  document.documentElement.setAttribute("data-theme", theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", BAR_COLOR[theme]);
  for (const l of listeners) l();
}

export function setThemePreference(next: ThemePreference): void {
  preference = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // keep the choice for this session only
  }
  apply(true);
}

export function initTheme(): void {
  apply();
  media.addEventListener("change", () => {
    if (preference === "system") apply(true);
  });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, () => preference, () => preference);
}
