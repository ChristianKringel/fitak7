import "server-only";

import { createDeezerClient, DeezerError } from "./client";
import type { DeezerTrack } from "./types";

// Preview URLs expire, so tracks are only cached briefly. The cache lives
// per server instance, which is enough to avoid hammering Deezer.
const TRACK_TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 2000;
const DATA_NOT_FOUND = 800;

// Request-time client: fail fast instead of making the player wait.
const deezer = createDeezerClient({ maxRetries: 2, maxBackoffMs: 2000, timeoutMs: 5000 });

const cache = new Map<number, { expires: number; track: Promise<DeezerTrack | null> }>();

async function fetchTrack(id: number): Promise<DeezerTrack | null> {
  try {
    return await deezer.getTrack(id);
  } catch (error) {
    if (error instanceof DeezerError && error.code === DATA_NOT_FOUND) return null;
    throw error;
  }
}

/** Fetches /track/{id} with a short cache. Null when Deezer has no such track. */
export function getTrack(id: number): Promise<DeezerTrack | null> {
  const now = Date.now();
  const hit = cache.get(id);
  if (hit && hit.expires > now) return hit.track;

  const track = fetchTrack(id);
  cache.set(id, { expires: now + TRACK_TTL_MS, track });
  // Don't keep failures around; the next request retries.
  track.catch(() => cache.delete(id));
  if (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return track;
}

/** First playable preview URL among the given versions, in order. */
export async function resolvePreview(trackIds: readonly number[]): Promise<string | null> {
  for (const id of trackIds) {
    const track = await getTrack(id).catch(() => null);
    if (track?.readable && track.preview) return track.preview;
  }
  return null;
}
