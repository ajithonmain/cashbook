import { useEffect, useState } from "react";
import { fetchSignupMode, type SignupMode } from "../lib/account";
import { useAuth } from "../lib/auth";
import AccountRows from "./account/AccountPanel";
import AuthForm from "./account/AuthForm";
import { InstallRow, ShareRow, StorageRow, UpdateRow } from "./settings/AppRows";
import ThemeRow from "./settings/ThemeRow";
import { Group, PillButton, Row } from "./ui/ListGroup";
import Sheet from "./ui/Sheet";

export default function Settings() {
  const auth = useAuth();
  const [signup, setSignup] = useState<SignupMode | null | undefined>(undefined);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!auth || auth.expired) void fetchSignupMode().then(setSignup);
  }, [auth]);

  useEffect(() => {
    if (auth && !auth.expired) setAuthOpen(false);
  }, [auth]);

  return (
    <div className="min-h-dvh bg-bg px-4 pb-20 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <section className="mb-4">
        <h2 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.6px] text-fg-muted">Appearance</h2>
        <ThemeRow />
      </section>

      <Group label="Sync">
        {auth && !auth.expired ? (
          <AccountRows auth={auth} />
        ) : signup === null ? (
          <Row title="Sync" sub="Not set up on this server" />
        ) : (
          <Row
            title={auth?.expired ? "Session ended" : "Sign in"}
            sub={auth?.expired ? auth.user.email : "Sync your books across devices"}
            right={
              <PillButton solid disabled={signup === undefined} onClick={() => setAuthOpen(true)}>
                Sign in
              </PillButton>
            }
          />
        )}
      </Group>

      <Group label="App">
        <InstallRow />
        <UpdateRow />
        <StorageRow />
        <ShareRow />
      </Group>

      {authOpen && signup && (
        <Sheet onClose={() => setAuthOpen(false)}>
          <AuthForm signup={signup} expiredEmail={auth?.expired ? auth.user.email : undefined} />
        </Sheet>
      )}
    </div>
  );
}
