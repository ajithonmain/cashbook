import { api } from "./api";
import { clearAuth, describeDevice, getAuth, setAuth, type AuthUser } from "./auth";
import { countSyncQueue, destroyScope, getScope, importRecords, LOCAL_SCOPE, readScope, setScope } from "./db";
import { resetSyncState, runSync } from "./sync";

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface SessionInfo {
  id: string;
  deviceName: string;
  createdAt: number;
  lastSeenAt: number;
  current: boolean;
}

export type SignupMode = "open" | "invite" | "closed";

export async function fetchSignupMode(): Promise<SignupMode | null> {
  try {
    const res = await api<{ signup: SignupMode }>("/health", { auth: false });
    return res.signup;
  } catch {
    return null; // backend not deployed or unreachable
  }
}

/**
 * Switches the app to the account: opens that user's database, moves any signed-out
 * ("local") data into it so nothing is lost, then starts syncing.
 */
async function adopt(res: AuthResponse): Promise<{ imported: number }> {
  const previous = getScope();
  setScope(res.user.id);

  let imported = 0;
  if (previous === LOCAL_SCOPE) {
    const snapshot = await readScope(LOCAL_SCOPE);
    if (snapshot.books.length + snapshot.transactions.length > 0) {
      imported = await importRecords(snapshot);
      await destroyScope(LOCAL_SCOPE);
    }
  }

  setAuth(res.token, res.user);
  resetSyncState();
  void runSync();
  return { imported };
}

export async function register(email: string, password: string, inviteCode: string) {
  const res = await api<AuthResponse>("/auth/register", {
    method: "POST",
    auth: false,
    body: { email, password, inviteCode, deviceName: describeDevice() },
  });
  return adopt(res);
}

export async function signIn(email: string, password: string) {
  const res = await api<AuthResponse>("/auth/login", {
    method: "POST",
    auth: false,
    body: { email, password, deviceName: describeDevice() },
  });
  return adopt(res);
}

/** Tries one last sync and returns how many local changes still have not reached the server. */
export async function pendingBeforeSignOut(): Promise<number> {
  await runSync();
  return countSyncQueue();
}

async function leaveAccount(): Promise<void> {
  const scope = getScope();
  clearAuth();
  setScope(LOCAL_SCOPE);
  if (scope !== LOCAL_SCOPE) await destroyScope(scope);
  resetSyncState();
}

/** Signs out and removes this account's data from this device (it stays on the server). */
export async function signOut(): Promise<void> {
  if (getAuth()) {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // offline or already expired: the local sign-out below still proceeds
    }
  }
  await leaveAccount();
}

export async function deleteAccount(password: string): Promise<void> {
  await api("/auth/account", { method: "DELETE", body: { password } });
  await leaveAccount();
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api("/auth/password", { method: "POST", body: { currentPassword, newPassword } });
}

export async function listSessions(): Promise<SessionInfo[]> {
  const res = await api<{ sessions: SessionInfo[] }>("/auth/sessions");
  return res.sessions;
}

export async function revokeSession(id: string): Promise<void> {
  await api(`/auth/sessions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}
