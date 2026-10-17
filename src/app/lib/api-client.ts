export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** JSON fetch that throws an ApiError with a user-presentable message on failure. */
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    // fetch only rejects when the request couldn't be made at all.
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (body as { error?: string } | null)?.error ?? `Something went wrong (error ${response.status}).`;
    throw new ApiError(message, response.status, body);
  }
  return body as T;
}
