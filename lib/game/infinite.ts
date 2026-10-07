import type { PoolSong } from "./pool";
import { answerCandidates, popularityWeight } from "./popularity";
import { weightedPick, type Rng } from "./rng";

/**
 * Picks a random song, among each artist's most popular ones and favoring
 * the top of the ranking, not played in this session. When every candidate
 * was already played, starts over (still avoiding the most recent one).
 */
export function pickInfiniteSong<T extends Pick<PoolSong, "id" | "topPosition">>(
  pool: readonly T[],
  playedIds: readonly string[],
  rng: Rng,
): T {
  const candidates = answerCandidates(pool);
  const played = new Set(playedIds);
  const fresh = candidates.filter((s) => !played.has(s.id));
  if (fresh.length > 0) return weightedPick(rng, fresh, (s) => popularityWeight(s));
  const last = playedIds.at(-1);
  const restart = candidates.filter((s) => s.id !== last);
  return weightedPick(rng, restart.length > 0 ? restart : candidates, (s) =>
    popularityWeight(s),
  );
}
