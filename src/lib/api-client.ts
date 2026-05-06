/**
 * Tiny typed `fetch` wrapper used by every TanStack Query hook.
 *
 * - Throws ApiError with `code` + `status` on non-2xx so `useMutation.onError`
 *   can branch on `error.code`.
 * - JSON in, JSON out.
 */

export class ApiError extends Error {
  status: number;
  code: string;
  detail: unknown;
  constructor(status: number, code: string, detail?: unknown) {
    super(code);
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export async function api<T = unknown>(
  path: string,
  options: { method?: Method; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const { method = "GET", body, signal } = options;
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string; detail?: unknown };
    throw new ApiError(res.status, data.error ?? "request_failed", data.detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
