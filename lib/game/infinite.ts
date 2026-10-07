import type { PoolSong } from "./pool";
import { pick, type Rng } from "./rng";

/**
 * Picks a random song not played in this session. When every song was
 * already played, starts over (still avoiding the most recent one).
 */
export function pickInfiniteSong<T extends Pick<PoolSong, "id">>(
  pool: readonly T[],
  playedIds: readonly string[],
  rng: Rng,
): T {
  const played = new Set(playedIds);
  const fresh = pool.filter((s) => !played.has(s.id));
  if (fresh.length > 0) return pick(rng, fresh);
  const last = playedIds.at(-1);
  const restart = pool.filter((s) => s.id !== last);
  return pick(rng, restart.length > 0 ? restart : pool);
}
