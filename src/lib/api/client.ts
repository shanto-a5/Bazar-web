/**
 * API client.
 *
 * One place that knows how to talk to the Bazar API: the response envelope, the
 * error shape, authentication, timeouts and request ids. Everything above this
 * layer deals in domain values and `ApiError`s.
 *
 * Two behaviours are deliberate and load-bearing:
 *
 *   1. Every response is validated against the envelope before it is handed on,
 *      so a proxy error page or an HTML body becomes a typed error rather than an
 *      undefined access three frames later.
 *   2. There is no retry on a request that may have been applied, and there is no
 *      fallback to another source. A failure is reported; it is never hidden.
 */
import { apiBaseUrl, requestTimeoutMs } from "@/lib/config";

export type ApiErrorCode =
  | "validation_failed"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "unprocessable"
  | "rate_limited"
  | "internal_error"
  | "network_error"
  | "timeout"
  | "malformed_response";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | string;
  readonly field?: string;
  readonly fields: { field: string; message: string }[];
  readonly requestId?: string;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: ApiErrorCode | string;
      field?: string;
      fields?: { field: string; message: string }[];
      requestId?: string;
    } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status ?? 0;
    this.code = options.code ?? "network_error";
    this.fields = options.fields ?? [];
    this.field = options.field ?? this.fields[0]?.field;
    this.requestId = options.requestId;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isRetryable(): boolean {
    return (
      this.code === "network_error" ||
      this.code === "timeout" ||
      this.status === 503 ||
      this.status === 429
    );
  }
}

interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string; fields?: { field: string; message: string }[] };
  meta?: { requestId?: string };
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** When false the Authorization header is omitted (used by register/login). */
  authenticated?: boolean;
  signal?: AbortSignal;
  /** Next.js server fetch revalidation (seconds). Ignored in the browser. */
  revalidate?: number | false;
}

type NextFetchInit = RequestInit & { next?: { revalidate?: number | false } };

function buildQuery(query: RequestOptions["query"]): string {
  if (!query) return "";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

export class ApiClient {
  private token: string | null = null;

  constructor(private readonly root: string = apiBaseUrl) {}

  setToken(token: string | null): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  hasToken(): boolean {
    return this.token !== null;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    if (!this.root) {
      throw new ApiError("No API is configured. Set NEXT_PUBLIC_API_BASE_URL.", { code: "network_error" });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    if (options.signal) {
      if (options.signal.aborted) controller.abort();
      else options.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    const headers: Record<string, string> = { accept: "application/json" };
    if (options.body !== undefined) headers["content-type"] = "application/json";
    const usedBearer = options.authenticated !== false && this.token !== null;
    if (usedBearer && this.token) headers.authorization = `Bearer ${this.token}`;

    const init: NextFetchInit = {
      method: options.method ?? "GET",
      headers,
      signal: controller.signal,
    };
    if (options.body !== undefined) init.body = JSON.stringify(options.body);
    if (options.revalidate !== undefined) init.next = { revalidate: options.revalidate };

    let response: Response;
    let body = "";
    try {
      response = await fetch(`${this.root}${path}${buildQuery(options.query)}`, init);
      body = await response.text();
    } catch {
      clearTimeout(timeout);
      throw new ApiError(
        `Could not reach the Bazar API at ${this.root}. Check the connection.`,
        { code: "timeout" },
      );
    } finally {
      clearTimeout(timeout);
    }

    const requestId = response.headers.get("x-request-id") ?? undefined;
    let envelope: ApiEnvelope<T> | null = null;
    if (body) {
      try {
        envelope = JSON.parse(body) as ApiEnvelope<T>;
      } catch {
        envelope = null;
      }
    }

    if (!response.ok || !envelope || envelope.ok !== true) {
      const error = this.toError(response.status, envelope, requestId);
      if (error.status === 401 && usedBearer) {
        try {
          await notifyUnauthorized();
        } catch {
          /* keep the original error */
        }
      }
      throw error;
    }

    if (envelope.data === undefined) {
      throw new ApiError("The server returned an empty response.", {
        status: response.status,
        code: "malformed_response",
        requestId,
      });
    }
    return envelope.data;
  }

  private toError(status: number, envelope: ApiEnvelope<unknown> | null, requestId?: string): ApiError {
    if (!envelope || typeof envelope !== "object" || !envelope.error) {
      return new ApiError(
        `The server returned an unexpected response (HTTP ${status}). It may not be a Bazar API.`,
        { status, code: "malformed_response", requestId },
      );
    }
    const { code, message, fields } = envelope.error;
    return new ApiError(message || "The request failed.", { status, code, fields, requestId });
  }

  get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  patch<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  delete<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

export type UnauthorizedHandler = () => void | Promise<void>;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Registered once by the session layer so a 401 can clear the stored token. */
export function onUnauthorized(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler;
}

export async function notifyUnauthorized(): Promise<void> {
  if (unauthorizedHandler) await unauthorizedHandler();
}

/** A client with no token, for server-side public reads. */
export function createServerClient(): ApiClient {
  return new ApiClient();
}

let browserClient: ApiClient | null = null;

/** The shared browser client. Its token is set by the session store. */
export function getBrowserClient(): ApiClient {
  if (!browserClient) browserClient = new ApiClient();
  return browserClient;
}
