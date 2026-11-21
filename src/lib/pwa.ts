import { useSyncExternalStore } from "react";
import { registerSW } from "virtual:pwa-register";

export type UpdateStatus = "idle" | "checking" | "available" | "latest" | "offline" | "error";

interface PwaState {
  needRefresh: boolean;
  status: UpdateStatus;
  lastChecked: number | null;
  installEvent: BeforeInstallPromptEvent | null;
  installed: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const APP_VERSION = __APP_VERSION__;
export const BUILD_TIME = __BUILD_TIME__;

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

let state: PwaState = {
  needRefresh: false,
  status: "idle",
  lastChecked: null,
  installEvent: null,
  installed: isStandalone(),
};
const listeners = new Set<() => void>();
let registration: ServiceWorkerRegistration | undefined;
let updateSW: ((reload?: boolean) => Promise<void>) | undefined;
let started = false;

function set(patch: Partial<PwaState>) {
  state = { ...state, ...patch };
  for (const l of listeners) l();
}

export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  const ua = navigator.userAgent;
  if (/Android/.test(ua)) return false;
  // iPadOS reports itself as a Mac but has a touch screen.
  return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function initPwa(): void {
  if (started) return;
  started = true;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    set({ installEvent: e as BeforeInstallPromptEvent });
  });
  window.addEventListener("appinstalled", () => set({ installEvent: null, installed: true }));

  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      set({ needRefresh: true, status: "available" });
    },
    onRegisteredSW(_url, reg) {
      registration = reg;
    },
  });

  const check = () => void checkForUpdates({ silent: true });
  setInterval(check, CHECK_INTERVAL_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") check();
  });
}

export async function checkForUpdates({ silent = false } = {}): Promise<void> {
  if (!registration) {
    if (!silent) set({ status: "error" });
    return;
  }
  if (!navigator.onLine) {
    if (!silent) set({ status: "offline" });
    return;
  }
  if (!silent) set({ status: "checking" });
  try {
    await registration.update();
    // A found update downloads, then onNeedRefresh fires. Give it a moment before concluding.
    await new Promise((r) => setTimeout(r, silent ? 0 : 1500));
    set({ lastChecked: Date.now(), status: state.needRefresh ? "available" : silent ? state.status : "latest" });
  } catch {
    if (!silent) set({ status: "error" });
  }
}

export async function applyUpdate(): Promise<void> {
  await updateSW?.(true);
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const evt = state.installEvent;
  if (!evt) return "unavailable";
  await evt.prompt();
  const { outcome } = await evt.userChoice;
  set({ installEvent: null });
  return outcome;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function usePwa(): PwaState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export interface StorageInfo {
  usage: number | null;
  quota: number | null;
  persisted: boolean | null;
}

export async function readStorage(): Promise<StorageInfo> {
  const s = navigator.storage;
  if (!s) return { usage: null, quota: null, persisted: null };
  const [est, persisted] = await Promise.all([
    s.estimate?.().catch(() => undefined),
    s.persisted?.().catch(() => undefined),
  ]);
  return { usage: est?.usage ?? null, quota: est?.quota ?? null, persisted: persisted ?? null };
}

export async function requestPersistence(): Promise<boolean> {
  return (await navigator.storage?.persist?.()) ?? false;
}
