// Popularity rules: which songs can be the answer of a round and how likely
// each one is to be picked. Positions come from PoolSong.topPosition
// (1 = the artist's most popular song).

import { MIN_TOP_SONGS_PER_ARTIST, TOP_SHARE_PER_ARTIST } from "./config";
import type { PoolSong } from "./pool";

export type RankedSong = Pick<PoolSong, "artist" | "topPosition">;

export interface AnswerCandidates<T extends RankedSong> {
  /** Each artist's most popular songs. */
  songs: T[];
  /**
   * Pick weight that decreases linearly with the position: the artist's #1
   * is twice as likely as the song right at the artist's cut.
   */
  weight: (song: T) => number;
}

/** How many of an artist's `songCount` songs can be answers. */
export function topCutoff(songCount: number, share: number = TOP_SHARE_PER_ARTIST): number {
  return Math.min(songCount, Math.max(MIN_TOP_SONGS_PER_ARTIST, Math.ceil(songCount * share)));
}

export function answerCandidates<T extends RankedSong>(
  pool: readonly T[],
  share: number = TOP_SHARE_PER_ARTIST,
): AnswerCandidates<T> {
  const counts = new Map<string, number>();
  for (const song of pool) counts.set(song.artist, (counts.get(song.artist) ?? 0) + 1);
  const cutoff = (song: T) => topCutoff(counts.get(song.artist) ?? 0, share);

  return {
    songs: pool.filter((s) => s.topPosition <= cutoff(s)),
    weight: (song) => {
      const top = cutoff(song);
      const position = Math.min(song.topPosition, top);
      return 2 - (position - 1) / Math.max(top, 1);
    },
  };
}
