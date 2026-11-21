import { useSyncState } from "../../lib/sync";

export default function SyncBadge() {
  const { status, pending } = useSyncState();
  if (status === "local") return null;

  const label =
    status === "syncing"
      ? "Syncing"
      : status === "offline"
      ? pending > 0
        ? `Offline, ${pending} pending`
        : "Offline"
      : status === "expired"
      ? "Sign in again"
      : status === "error"
      ? "Sync error"
      : pending > 0
      ? `${pending} pending`
      : "Synced";
  const tone =
    status === "idle" && pending === 0
      ? "bg-in/15 text-in"
      : status === "error" || status === "expired"
      ? "bg-out/15 text-out"
      : "bg-white/10 text-fg-muted";

  return (
    <span role="status" className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tone}`}>
      {label}
    </span>
  );
}
