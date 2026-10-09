import "server-only";

import { earliestReleaseYear, recordingQuery, searchTitle } from "./match";
import type { MusicBrainzRecordingSearch } from "./types";

export const MUSICBRAINZ_BASE_URL = "https://musicbrainz.org/ws/2";
// MusicBrainz asks for an identifying User-Agent with a contact URL.
const USER_AGENT = "FitaK7/0.1 ( https://github.com/ChristianKringel/fitak7 )";
const SEARCH_LIMIT = 100;

export interface MusicBrainzClientOptions {
  baseUrl?: string;
  /** MusicBrainz allows 1 request per second per client. */
  minIntervalMs?: number;
  maxRetries?: number;
  baseBackoffMs?: number;
  timeoutMs?: number;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export class MusicBrainzError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MusicBrainzError";
  }
}

export function createMusicBrainzClient(options: MusicBrainzClientOptions = {}) {
  const baseUrl = options.baseUrl ?? MUSICBRAINZ_BASE_URL;
  const minIntervalMs = options.minIntervalMs ?? 1100;
  const maxRetries = options.maxRetries ?? 5;
  const baseBackoffMs = options.baseBackoffMs ?? 2000;
  const timeoutMs = options.timeoutMs ?? 15_000;
  const fetchFn = options.fetch ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const now = options.now ?? Date.now;

  // Requests are serialized and spaced by `minIntervalMs`.
  let tail: Promise<unknown> = Promise.resolve();
  let lastRequestAt = -Infinity;

  async function fetchOnce(url: string): Promise<Response | null> {
    const wait = lastRequestAt + minIntervalMs - now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = now();
    try {
      return await fetchFn(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      return null; // network error, retried
    }
  }

  async function request<T>(url: string): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      const response = await fetchOnce(url);
      if (response?.ok) return (await response.json()) as T;
      // 503 means the rate limit was hit; network errors are retried too.
      const retryable = response === null || response.status === 503 || response.status >= 500;
      if (!retryable || attempt >= maxRetries) {
        throw new MusicBrainzError(
          `MusicBrainz request failed (${response ? `HTTP ${response.status}` : "network error"}): ${url}`,
        );
      }
      await sleep(baseBackoffMs * 2 ** attempt);
    }
  }

  function get<T>(url: string): Promise<T> {
    const result = tail.then(() => request<T>(url));
    tail = result.catch(() => undefined);
    return result;
  }

  return {
    /** Earliest release year of the song by this artist, or null if not found. */
    async findReleaseYear(title: string, artist: string): Promise<number | null> {
      const url = new URL(`${baseUrl}/recording`);
      url.searchParams.set("query", recordingQuery(searchTitle(title), artist));
      url.searchParams.set("limit", String(SEARCH_LIMIT));
      url.searchParams.set("fmt", "json");
      const body = await get<MusicBrainzRecordingSearch>(url.toString());
      return earliestReleaseYear(body.recordings ?? [], title, artist);
    },
  };
}

export type MusicBrainzClient = ReturnType<typeof createMusicBrainzClient>;
