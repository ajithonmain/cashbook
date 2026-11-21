import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { fetchSignupMode, register, signIn, type SignupMode } from "../../lib/account";
import { showToast } from "../../lib/toast";

const inputCls =
  "w-full rounded-xl border border-border/10 bg-surface-2 px-3.5 py-3 text-base text-fg outline-none placeholder:text-fg-muted focus:border-brand focus:ring-2 focus:ring-brand/30";
const labelCls = "mb-1.5 block text-xs font-semibold text-fg-muted";

export default function AuthForm({ expiredEmail }: { expiredEmail?: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signup, setSignup] = useState<SignupMode | null | undefined>(undefined);
  const [email, setEmail] = useState(expiredEmail ?? "");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchSignupMode().then(setSignup);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result =
        mode === "signin"
          ? await signIn(email.trim(), password)
          : await register(email.trim(), password, inviteCode);
      showToast(
        result.imported > 0 ? `Signed in. ${result.imported} local items added to your account.` : "Signed in",
        { variant: "success" }
      );
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Cannot reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (signup === undefined) {
    return <div className="skeleton h-40 rounded-2xl" aria-label="Loading" />;
  }

  if (signup === null) {
    return (
      <div className="rounded-2xl border border-border/10 bg-surface p-4 shadow-card">
        <p className="font-bold text-fg">Sync is not available</p>
        <p className="mt-1 text-sm text-fg-muted">
          This copy of CashBook is running without a backend, or you are offline. Your data is saved on this
          device. Deploy the backend to sign in and sync across devices (see the README).
        </p>
      </div>
    );
  }

  const canSignUp = signup !== "closed";

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border/10 bg-surface p-4 shadow-card">
      <h2 className="text-base font-bold text-fg">{mode === "signin" ? "Sign in to sync" : "Create your account"}</h2>
      <p className="mb-4 mt-1 text-xs text-fg-muted">
        {expiredEmail
          ? "Your session ended. Sign in again to resume syncing."
          : "Your books stay on this device and sync across every device you sign in on."}
      </p>

      <div className="space-y-3">
        <div>
          <label htmlFor="auth-email" className={labelCls}>
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="auth-password" className={labelCls}>
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={mode === "signup" ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
          {mode === "signup" && <p className="mt-1 text-xs text-fg-muted">At least 8 characters.</p>}
        </div>
        {mode === "signup" && signup === "invite" && (
          <div>
            <label htmlFor="auth-invite" className={labelCls}>
              Invite code
            </label>
            <input
              id="auth-invite"
              autoComplete="off"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Ask the person who runs this server"
              className={inputCls}
            />
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-out">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="press mt-4 w-full rounded-xl bg-brand py-3.5 text-base font-bold text-bg disabled:opacity-60"
      >
        {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError("");
        }}
        disabled={!canSignUp && mode === "signin"}
        className="press mt-3 w-full py-2 text-sm font-semibold text-brand disabled:text-fg-muted"
      >
        {mode === "signin"
          ? canSignUp
            ? "New here? Create an account"
            : "Sign-up is closed on this server"
          : "Have an account? Sign in"}
      </button>
    </form>
  );
}
