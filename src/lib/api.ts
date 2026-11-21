import { getAuth, markExpired } from "./auth";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

interface Options {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  /** Send the stored bearer token. Disable for login / register / health. */
  auth?: boolean;
}

/** Network failures throw the browser's TypeError; HTTP failures throw ApiError. */
export async function api<T = unknown>(path: string, { method = "GET", body, auth = true }: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const state = getAuth();
    if (!state) throw new ApiError(401, "Not signed in");
    headers.Authorization = `Bearer ${state.token}`;
  }

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON (for example a Pages 404 when the backend is not deployed)
  }

  if (!res.ok) {
    if (res.status === 401 && auth) markExpired();
    const message =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}
