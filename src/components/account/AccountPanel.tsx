import { useEffect, useState } from "react";
import type { AuthState } from "../../lib/auth";
import {
  changePassword,
  deleteAccount,
  listSessions,
  pendingBeforeSignOut,
  revokeSession,
  signOut,
  type SessionInfo,
} from "../../lib/account";
import { ApiError } from "../../lib/api";
import { runSync, useSyncState, type SyncStatus } from "../../lib/sync";
import { showToast } from "../../lib/toast";
import ConfirmDialog from "../ui/ConfirmDialog";
import Sheet from "../ui/Sheet";

const inputCls =
  "w-full rounded-xl border border-border/10 bg-surface-2 px-3.5 py-3 text-base text-fg outline-none placeholder:text-fg-muted focus:border-brand focus:ring-2 focus:ring-brand/30";
const labelCls = "mb-1.5 block text-xs font-semibold text-fg-muted";
const rowCls = "press flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium text-fg";

const STATUS_LABEL: Record<SyncStatus, string> = {
  local: "Not signed in",
  idle: "Up to date",
  syncing: "Syncing...",
  offline: "Offline. Changes will sync when you reconnect.",
  error: "Sync problem",
  expired: "Session ended. Sign in again.",
};

function relativeTime(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

function DevicesSheet({ onClose }: { onClose: () => void }) {
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setSessions(await listSessions());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Cannot reach the server");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pb-6 pt-1">
        <h2 className="mb-1 text-lg font-extrabold text-fg">Signed-in devices</h2>
        <p className="mb-4 text-xs text-fg-muted">Remove a device to sign it out remotely.</p>
        {error && <p className="text-sm text-out">{error}</p>}
        {sessions === null && !error && <div className="skeleton h-16 rounded-xl" />}
        <ul className="divide-y divide-border/10 overflow-hidden rounded-xl border border-border/10 bg-surface-2">
          {sessions?.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">
                  {s.deviceName || "Unknown device"}
                  {s.current && <span className="ml-2 rounded-full bg-in/15 px-2 py-0.5 text-[10px] font-bold text-in">This device</span>}
                </p>
                <p className="text-xs text-fg-muted">Active {relativeTime(s.lastSeenAt)}</p>
              </div>
              {!s.current && (
                <button
                  onClick={async () => {
                    await revokeSession(s.id);
                    showToast("Device signed out", { variant: "success" });
                    await load();
                  }}
                  className="press flex-none rounded-lg px-3 py-2 text-xs font-bold text-out"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  );
}

function PasswordSheet({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await changePassword(current, next);
      showToast("Password changed. Other devices were signed out.", { variant: "success" });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Cannot reach the server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet onClose={onClose}>
      <form onSubmit={submit} className="space-y-3 px-5 pb-6 pt-1">
        <h2 className="text-lg font-extrabold text-fg">Change password</h2>
        <div>
          <label htmlFor="pw-current" className={labelCls}>
            Current password
          </label>
          <input id="pw-current" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="pw-new" className={labelCls}>
            New password
          </label>
          <input id="pw-new" type="password" autoComplete="new-password" minLength={8} required value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} />
        </div>
        {error && (
          <p role="alert" className="text-sm text-out">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="press w-full rounded-xl bg-brand py-3.5 text-base font-bold text-bg disabled:opacity-60">
          {busy ? "Saving..." : "Update password"}
        </button>
      </form>
    </Sheet>
  );
}

function DeleteAccountSheet({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await deleteAccount(password);
      showToast("Account deleted");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Cannot reach the server");
      setBusy(false);
    }
  }

  return (
    <Sheet onClose={onClose}>
      <form onSubmit={submit} className="space-y-3 px-5 pb-6 pt-1">
        <h2 className="text-lg font-extrabold text-out">Delete account</h2>
        <p className="text-sm text-fg-muted">
          This permanently deletes your account and every book and entry stored on the server, and clears this
          device. It cannot be undone.
        </p>
        <div>
          <label htmlFor="del-password" className={labelCls}>
            Confirm with your password
          </label>
          <input id="del-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        </div>
        {error && (
          <p role="alert" className="text-sm text-out">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="press w-full rounded-xl bg-out py-3.5 text-base font-bold text-bg disabled:opacity-60">
          {busy ? "Deleting..." : "Delete everything"}
        </button>
      </form>
    </Sheet>
  );
}

export default function AccountPanel({ auth }: { auth: AuthState }) {
  const sync = useSyncState();
  const [sheet, setSheet] = useState<"devices" | "password" | "delete" | null>(null);
  const [signOutPending, setSignOutPending] = useState<number | null>(null);

  async function startSignOut() {
    const pending = await pendingBeforeSignOut();
    if (pending > 0) setSignOutPending(pending);
    else await signOut();
  }

  const dot =
    sync.status === "idle" ? "bg-in" : sync.status === "syncing" ? "bg-brand" : sync.status === "error" || sync.status === "expired" ? "bg-out" : "bg-fg-muted";

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border/10 bg-surface shadow-card">
        <div className="px-4 py-4">
          <p className="text-xs font-semibold text-fg-muted">Signed in as</p>
          <p className="truncate text-base font-bold text-fg">{auth.user.email}</p>
          <div className="mt-3 flex items-center gap-2 text-sm text-fg-muted">
            <span className={`h-2 w-2 flex-none rounded-full ${dot}`} aria-hidden="true" />
            <span>{STATUS_LABEL[sync.status]}</span>
          </div>
          <p className="mt-1 text-xs text-fg-muted">
            {sync.pending > 0 ? `${sync.pending} change${sync.pending === 1 ? "" : "s"} waiting to upload. ` : ""}
            {sync.lastSyncAt ? `Last synced ${relativeTime(sync.lastSyncAt)}.` : ""}
          </p>
          {sync.error && <p className="mt-1 text-xs text-out">{sync.error}</p>}
        </div>
        <div className="divide-y divide-border/10 border-t border-border/10">
          <button onClick={() => void runSync()} className={rowCls}>
            Sync now
          </button>
          <button onClick={() => setSheet("devices")} className={rowCls}>
            Signed-in devices
          </button>
          <button onClick={() => setSheet("password")} className={rowCls}>
            Change password
          </button>
          <button onClick={() => void startSignOut()} className={rowCls}>
            Sign out
          </button>
          <button onClick={() => setSheet("delete")} className={`${rowCls} text-out`}>
            Delete account
          </button>
        </div>
      </div>

      {sheet === "devices" && <DevicesSheet onClose={() => setSheet(null)} />}
      {sheet === "password" && <PasswordSheet onClose={() => setSheet(null)} />}
      {sheet === "delete" && <DeleteAccountSheet onClose={() => setSheet(null)} />}

      {signOutPending !== null && (
        <ConfirmDialog
          title="Sign out with unsynced changes?"
          description={`${signOutPending} change${signOutPending === 1 ? " has" : "s have"} not reached the server yet and will be lost if you sign out now. Connect to the internet and sync first to keep them.`}
          confirmLabel="Sign out anyway"
          onCancel={() => setSignOutPending(null)}
          onConfirm={() => {
            setSignOutPending(null);
            void signOut();
          }}
        />
      )}
    </>
  );
}
