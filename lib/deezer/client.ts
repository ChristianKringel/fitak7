import "server-only";

import type {
  DeezerAlbumSummary,
  DeezerAlbumTrack,
  DeezerArtist,
  DeezerArtistSummary,
  DeezerErrorBody,
  DeezerPage,
  DeezerTrack,
} from "./types";

export const DEEZER_BASE_URL = "https://api.deezer.com";

// Deezer error codes worth retrying: quota exceeded and service busy.
const RETRYABLE_DEEZER_CODES = new Set([4, 700]);
const DEEZER_QUOTA_CODE = 4;
const PAGE_SIZE = 100;

export class DeezerError extends Error {
  readonly code: number | undefined;
  readonly status: number | undefined;
  readonly retryable: boolean;

  constructor(
    message: string,
    opts: { code?: number; status?: number; retryable: boolean },
  ) {
    super(message);
    this.name = "DeezerError";
    this.code = opts.code;
    this.status = opts.status;
    this.retryable = opts.retryable;
  }
}

export interface DeezerClientOptions {
  baseUrl?: string;
  /** Max requests per window. Deezer allows ~50 per 5s; stay below it. */
  maxRequests?: number;
  windowMs?: number;
  maxRetries?: number;
  baseBackoffMs?: number;
  maxBackoffMs?: number;
  timeoutMs?: number;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Sliding-window limiter; callers are served in FIFO order. */
class RateLimiter {
  private timestamps: number[] = [];
  private tail: Promise<void> = Promise.resolve();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number,
    private readonly sleep: (ms: number) => Promise<void>,
    private readonly now: () => number,
  ) {}

  acquire(): Promise<void> {
    const slot = this.tail.then(() => this.waitForSlot());
    this.tail = slot.catch(() => undefined);
    return slot;
  }

  private async waitForSlot(): Promise<void> {
    for (;;) {
      const now = this.now();
      this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
      if (this.timestamps.length < this.maxRequests) {
        this.timestamps.push(now);
        return;
      }
      await this.sleep(this.timestamps[0] + this.windowMs - now);
    }
  }
}

function isErrorBody(body: unknown): body is DeezerErrorBody {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as { error: unknown }).error === "object"
  );
}

export function createDeezerClient(options: DeezerClientOptions = {}) {
  const baseUrl = options.baseUrl ?? DEEZER_BASE_URL;
  const windowMs = options.windowMs ?? 5000;
  const maxRetries = options.maxRetries ?? 5;
  const baseBackoffMs = options.baseBackoffMs ?? 500;
  const maxBackoffMs = options.maxBackoffMs ?? 15_000;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const fetchFn = options.fetch ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const now = options.now ?? Date.now;
  const limiter = new RateLimiter(
    options.maxRequests ?? 40,
    windowMs,
    sleep,
    now,
  );

  function buildUrl(
    path: string,
    params?: Record<string, string | number>,
  ): string {
    const url = new URL(path, baseUrl);
    for (const [key, value] of Object.entries(params ?? {})) {
      url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  async function fetchOnce(url: string): Promise<unknown> {
    await limiter.acquire();
    let response: Response;
    try {
      response = await fetchFn(url, { signal: AbortSignal.timeout(timeoutMs) });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      throw new DeezerError(`Network error: ${message}`, { retryable: true });
    }
    if (!response.ok) {
      throw new DeezerError(`HTTP ${response.status} for ${url}`, {
        status: response.status,
        // Deezer also answers 403 for a while when it throttles a client.
        retryable: response.status === 403 || response.status === 429 || response.status >= 500,
      });
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new DeezerError(`Invalid JSON from ${url}`, { retryable: true });
    }
    // Deezer reports many errors with HTTP 200 and an `error` object.
    if (isErrorBody(body)) {
      const { code, type, message } = body.error;
      throw new DeezerError(`Deezer ${type} (${code ?? "?"}): ${message}`, {
        code,
        status: response.status,
        retryable: code !== undefined && RETRYABLE_DEEZER_CODES.has(code),
      });
    }
    return body;
  }

  async function request<T>(url: string): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return (await fetchOnce(url)) as T;
      } catch (error) {
        if (
          !(error instanceof DeezerError) ||
          !error.retryable ||
          attempt >= maxRetries
        ) {
          throw error;
        }
        const exponential = Math.min(maxBackoffMs, baseBackoffMs * 2 ** attempt);
        const jittered = exponential / 2 + Math.random() * (exponential / 2);
        // After a quota error, let the whole window drain.
        const delay =
          error.code === DEEZER_QUOTA_CODE
            ? Math.max(jittered, windowMs)
            : jittered;
        await sleep(delay);
      }
    }
  }

  function get<T>(
    path: string,
    params?: Record<string, string | number>,
  ): Promise<T> {
    return request<T>(buildUrl(path, params));
  }

  /** Follows `next` links until the list is exhausted. */
  async function getAll<T>(
    path: string,
    params?: Record<string, string | number>,
  ): Promise<T[]> {
    const items: T[] = [];
    let url: string | undefined = buildUrl(path, {
      limit: PAGE_SIZE,
      ...params,
    });
    while (url) {
      const page: DeezerPage<T> = await request<DeezerPage<T>>(url);
      const data = page.data ?? [];
      items.push(...data);
      if (!page.next || data.length === 0) break;
      const next = new URL(page.next);
      // Never follow a `next` link off the API host.
      if (next.origin !== new URL(baseUrl).origin) {
        throw new DeezerError(`Unexpected pagination host: ${page.next}`, {
          retryable: false,
        });
      }
      url = next.toString();
    }
    return items;
  }

  return {
    get,
    getAll,
    /** First page of artist search results, ordered by Deezer relevance. */
    async searchArtists(query: string, limit = 50) {
      const page = await get<DeezerPage<DeezerArtistSummary>>("/search/artist", {
        q: query,
        limit,
      });
      return page.data ?? [];
    },
    getArtist: (id: number) => get<DeezerArtist>(`/artist/${id}`),
    getArtistAlbums: (id: number) =>
      getAll<DeezerAlbumSummary>(`/artist/${id}/albums`),
    getAlbumTracks: (id: number) =>
      getAll<DeezerAlbumTrack>(`/album/${id}/tracks`),
    getTrack: (id: number) => get<DeezerTrack>(`/track/${id}`),
  };
}

export type DeezerClient = ReturnType<typeof createDeezerClient>;
