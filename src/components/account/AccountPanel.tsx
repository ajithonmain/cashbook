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
import { runSync, useSyncState } from "../../lib/sync";
import { showToast } from "../../lib/toast";
import ConfirmDialog from "../ui/ConfirmDialog";
import { Chevron, PillButton, Row } from "../ui/ListGroup";
import Sheet from "../ui/Sheet";

const inputCls =
  "w-full rounded-xl border border-border/10 bg-surface-2 px-3 py-2.5 text-base text-fg outline-none placeholder:text-fg-muted focus:border-brand focus:ring-2 focus:ring-brand/30";
const labelCls = "mb-1.5 block text-xs font-semibold text-fg-muted";
const primaryBtn = "press w-full rounded-xl bg-brand-solid py-2.5 text-sm font-bold text-on-brand disabled:opacity-60";

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
        <h2 className="mb-3 text-base font-bold text-fg">Signed-in devices</h2>
        {error && <p className="text-sm text-out">{error}</p>}
        {sessions === null && !error && <div className="skeleton h-16 rounded-xl" />}
        <ul className="divide-y divide-border/10 overflow-hidden rounded-xl border border-border/10 bg-surface-2">
          {sessions?.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">
                  {s.deviceName || "Unknown device"}
                  {s.current && <span className="ml-2 rounded-full bg-fg/10 px-2 py-0.5 text-[10px] font-bold text-fg">This device</span>}
                </p>
                <p className="text-xs text-fg-muted">Active {relativeTime(s.lastSeenAt)}</p>
              </div>
              {!s.current && (
                <PillButton
                  danger
                  onClick={async () => {
                    await revokeSession(s.id);
                    showToast("Device signed out", { variant: "success" });
                    await load();
                  }}
                >
                  Remove
                </PillButton>
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
        <h2 className="text-base font-bold text-fg">Change password</h2>
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
        <button type="submit" disabled={busy} className={primaryBtn}>
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
        <h2 className="text-base font-bold text-out">Delete account</h2>
        <p className="text-sm text-fg-muted">Permanently deletes your account and all books stored on the server, and clears this device.</p>
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
        <button type="submit" disabled={busy} className="press w-full rounded-xl bg-out-solid py-2.5 text-sm font-bold text-on-out disabled:opacity-60">
          {busy ? "Deleting..." : "Delete everything"}
        </button>
      </form>
    </Sheet>
  );
}

function syncLine(status: string, pending: number, error: string | null): string {
  const base =
    status === "idle"
      ? "Up to date"
      : status === "syncing"
      ? "Syncing..."
      : status === "offline"
      ? "Offline"
      : status === "expired"
      ? "Session ended"
      : error ?? "Sync problem";
  return pending > 0 ? `${base} · ${pending} pending` : base;
}

/** Rows for the signed-in state, to be placed inside a settings Group. */
export default function AccountRows({ auth }: { auth: AuthState }) {
  const sync = useSyncState();
  const [sheet, setSheet] = useState<"menu" | "devices" | "password" | "delete" | null>(null);
  const [signOutPending, setSignOutPending] = useState<number | null>(null);

  async function startSignOut() {
    setSheet(null);
    const pending = await pendingBeforeSignOut();
    if (pending > 0) setSignOutPending(pending);
    else await signOut();
  }

  return (
    <>
      <Row
        title={auth.user.email}
        sub={syncLine(sync.status, sync.pending, sync.error)}
        right={
          <PillButton disabled={sync.status === "syncing"} onClick={() => void runSync()}>
            Sync now
          </PillButton>
        }
      />
      <Row title="Account" sub="Devices, password, sign out" right={<PillButton onClick={() => setSheet("menu")}>Manage</PillButton>} />

      {sheet === "menu" && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="px-5 pb-6 pt-1">
            <h2 className="mb-1 text-base font-bold text-fg">Account</h2>
            <p className="mb-3 truncate text-sm text-fg-muted">{auth.user.email}</p>
            <div className="divide-y divide-border/10 overflow-hidden rounded-xl border border-border/10 bg-surface-2 px-4">
              <Row title="Signed-in devices" right={<Chevron />} onClick={() => setSheet("devices")} />
              <Row title="Change password" right={<Chevron />} onClick={() => setSheet("password")} />
              <Row title="Sign out" onClick={() => void startSignOut()} />
              <Row title="Delete account" danger onClick={() => setSheet("delete")} />
            </div>
          </div>
        </Sheet>
      )}
      {sheet === "devices" && <DevicesSheet onClose={() => setSheet(null)} />}
      {sheet === "password" && <PasswordSheet onClose={() => setSheet(null)} />}
      {sheet === "delete" && <DeleteAccountSheet onClose={() => setSheet(null)} />}

      {signOutPending !== null && (
        <ConfirmDialog
          title="Sign out with unsynced changes?"
          description={`${signOutPending} change${signOutPending === 1 ? " has" : "s have"} not reached the server and will be lost. Connect and sync first to keep them.`}
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
