import { useSyncExternalStore } from "react";

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthState {
  token: string;
  user: AuthUser;
  /** Set when the server rejected the stored token. Local data is kept; sync pauses until sign-in. */
  expired: boolean;
}

const KEY = "cashbook_auth";
const listeners = new Set<() => void>();

function load(): AuthState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    if (typeof parsed.token === "string" && parsed.user?.id && parsed.user.email) {
      return { token: parsed.token, user: parsed.user, expired: parsed.expired === true };
    }
  } catch {
    // corrupted storage: treat as signed out
  }
  return null;
}

let state: AuthState | null = load();

function commit(next: AuthState | null) {
  state = next;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    // storage unavailable (private mode): keep in memory for this session
  }
  for (const l of listeners) l();
}

export function getAuth(): AuthState | null {
  return state;
}

export function setAuth(token: string, user: AuthUser): void {
  commit({ token, user, expired: false });
}

export function markExpired(): void {
  if (state && !state.expired) commit({ ...state, expired: true });
}

export function clearAuth(): void {
  commit(null);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAuth(): AuthState | null {
  return useSyncExternalStore(subscribe, getAuth, getAuth);
}

export function describeDevice(): string {
  const ua = navigator.userAgent;
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
    ? "Android"
    : /Mac OS X/.test(ua)
    ? "macOS"
    : /Windows/.test(ua)
    ? "Windows"
    : /Linux/.test(ua)
    ? "Linux"
    : "Unknown OS";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Firefox\//.test(ua)
    ? "Firefox"
    : /Chrome\//.test(ua)
    ? "Chrome"
    : /Safari\//.test(ua)
    ? "Safari"
    : "Browser";
  const standalone = window.matchMedia("(display-mode: standalone)").matches ? " (installed)" : "";
  return `${os} ${browser}${standalone}`;
}
