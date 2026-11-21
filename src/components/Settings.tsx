import { useState } from "react";
import { getSyncToken, setSyncToken, runSync } from "../lib/sync";
import { showToast } from "../lib/toast";

export default function Settings() {
  const [token, setToken] = useState(getSyncToken());

  async function save() {
    const trimmed = token.trim();
    setSyncToken(trimmed);
    if (!trimmed) {
      showToast("Sync disabled. App stays local-only.");
      return;
    }
    showToast("Syncing...");
    await runSync();
    showToast("Saved and synced", { variant: "success" });
  }

  return (
    <div className="min-h-dvh bg-bg pb-28">
      <div className="safe-top px-4 pb-2 pt-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg">Settings</h1>
        <p className="text-sm text-fg-muted">Sync and preferences</p>
      </div>

      <div className="px-4 pt-2">
        <div className="rounded-2xl border border-border/10 bg-surface p-4 shadow-card">
          <label htmlFor="sync-token" className="mb-1 block text-sm font-bold text-fg">
            Sync token
          </label>
          <p className="mb-3 text-xs text-fg-muted">
            Paste the CASHBOOK_TOKEN secret from your Cloudflare Pages project to sync across devices. Leave empty
            to keep everything on this device only.
          </p>
          <input
            id="sync-token"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste sync token"
            className="mb-3 w-full rounded-xl border border-border/10 bg-surface-2 px-3.5 py-3 text-base text-fg outline-none placeholder:text-fg-muted focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
          <button onClick={() => void save()} className="press w-full rounded-xl bg-brand py-3.5 text-base font-bold text-white">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
