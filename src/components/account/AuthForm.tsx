import { useState } from "react";
import { ApiError } from "../../lib/api";
import { register, signIn, type SignupMode } from "../../lib/account";
import { showToast } from "../../lib/toast";

const inputCls =
  "w-full rounded-xl border border-border/10 bg-surface-2 px-3 py-2.5 text-base text-fg outline-none placeholder:text-fg-muted focus:border-brand focus:ring-2 focus:ring-brand/30";
const labelCls = "mb-1.5 block text-xs font-semibold text-fg-muted";

interface AuthFormProps {
  signup: SignupMode;
  expiredEmail?: string;
}

/** Form body for the sign-in sheet. */
export default function AuthForm({ signup, expiredEmail }: AuthFormProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState(expiredEmail ?? "");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result =
        mode === "signin" ? await signIn(email.trim(), password) : await register(email.trim(), password, inviteCode);
      showToast(result.imported > 0 ? `Signed in. ${result.imported} local items added.` : "Signed in", {
        variant: "success",
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Cannot reach the server. Check your connection.");
      setBusy(false);
    }
  }

  const canSignUp = signup !== "closed";

  return (
    <form onSubmit={submit} className="space-y-3 px-5 pb-6 pt-1">
      <h2 className="text-base font-bold text-fg">{mode === "signin" ? "Sign in" : "Create account"}</h2>

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
      </div>
      {mode === "signup" && signup === "invite" && (
        <div>
          <label htmlFor="auth-invite" className={labelCls}>
            Invite code
          </label>
          <input id="auth-invite" autoComplete="off" required value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} className={inputCls} />
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-out">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="press w-full rounded-xl bg-brand-solid py-2.5 text-sm font-bold text-on-brand disabled:opacity-60"
      >
        {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
      </button>

      {(canSignUp || mode === "signup") && (
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
          }}
          className="press min-h-11 w-full text-sm font-semibold text-fg"
        >
          {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
      )}
    </form>
  );
}
