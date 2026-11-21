import { useAuth } from "../lib/auth";
import AccountPanel from "./account/AccountPanel";
import AuthForm from "./account/AuthForm";

export default function Settings() {
  const auth = useAuth();

  return (
    <div className="min-h-dvh bg-bg pb-28">
      <div className="safe-top px-4 pb-2 pt-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg">Settings</h1>
        <p className="text-sm text-fg-muted">Account and sync</p>
      </div>

      <div className="space-y-4 px-4 pt-2">
        {auth && !auth.expired && <AccountPanel auth={auth} />}
        {auth?.expired && <AuthForm expiredEmail={auth.user.email} />}
        {!auth && <AuthForm />}

        <div className="rounded-2xl border border-border/10 bg-surface p-4 shadow-card">
          <p className="text-sm font-bold text-fg">Your data</p>
          <p className="mt-1 text-xs text-fg-muted">
            CashBook saves everything on this device first, so it works offline. When you are signed in, changes
            upload in the background and appear on your other devices.
          </p>
        </div>

        <p className="px-1 text-center text-xs text-fg-muted">CashBook is open source (MIT).</p>
      </div>
    </div>
  );
}
