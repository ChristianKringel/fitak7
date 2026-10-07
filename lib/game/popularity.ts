// Popularity rules: which songs can be the answer of a round and how likely
// each one is to be picked. Positions come from PoolSong.topPosition
// (1 = the artist's most popular song).

import { TOP_SONGS_PER_ARTIST } from "./config";
import type { PoolSong } from "./pool";

export type RankedSong = Pick<PoolSong, "topPosition">;

/** Songs that can be the answer: each artist's `top` most popular ones. */
export function answerCandidates<T extends RankedSong>(
  pool: readonly T[],
  top: number = TOP_SONGS_PER_ARTIST,
): T[] {
  return pool.filter((s) => s.topPosition <= top);
}

/**
 * Pick weight that decreases linearly with the position: the artist's #1 is
 * twice as likely as the song right at the cut.
 */
export function popularityWeight(
  song: RankedSong,
  top: number = TOP_SONGS_PER_ARTIST,
): number {
  const position = Math.min(song.topPosition, top);
  return 2 - (position - 1) / Math.max(top, 1);
}
