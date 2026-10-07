// Builds the 4 options of a round: the answer, 2 songs by the same artist
// and 1 by another artist of the category, falling back to whatever is
// available. Options are compared by normalized title, so no option can be
// another version of the answer or share a title with another option.

import { normalizeTitle } from "./normalize";
import type { PoolSong } from "./pool";
import { shuffle, type Rng } from "./rng";

export const OPTIONS_PER_ROUND = 4;
const SAME_ARTIST_DISTRACTORS = 2;

export type OptionSong = Pick<PoolSong, "id" | "title" | "artist">;

export interface RoundOptions<T extends OptionSong = OptionSong> {
  /** Shuffled; the answer is at `answerIndex`. */
  songs: T[];
  answerIndex: number;
}

export class NotEnoughOptionsError extends Error {
  constructor(songId: string) {
    super(`Not enough distinct titles to build options for ${songId}`);
    this.name = "NotEnoughOptionsError";
  }
}

/**
 * Orders other artists' songs round-robin over shuffled artists, so the
 * first picks come from different artists and big discographies don't
 * dominate.
 */
function interleaveByArtist<T extends OptionSong>(rng: Rng, songs: T[]): T[] {
  const byArtist = new Map<string, T[]>();
  for (const song of songs) {
    const list = byArtist.get(song.artist);
    if (list) list.push(song);
    else byArtist.set(song.artist, [song]);
  }
  const queues = shuffle(rng, [...byArtist.values()]).map((list) =>
    shuffle(rng, list),
  );
  const result: T[] = [];
  for (let i = 0; result.length < songs.length; i++) {
    for (const queue of queues) {
      if (i < queue.length) result.push(queue[i]);
    }
  }
  return result;
}

export function buildOptions<T extends OptionSong>(
  answer: T,
  pool: readonly T[],
  rng: Rng,
): RoundOptions<T> {
  const usedTitles = new Set([normalizeTitle(answer.title)]);
  const distractors: T[] = [];
  const needed = OPTIONS_PER_ROUND - 1;

  const take = (candidates: T[], count: number) => {
    let taken = 0;
    for (const song of candidates) {
      if (taken >= count || distractors.length >= needed) return;
      const key = normalizeTitle(song.title);
      if (usedTitles.has(key)) continue;
      usedTitles.add(key);
      distractors.push(song);
      taken++;
    }
  };

  const sameArtist = shuffle(
    rng,
    pool.filter((s) => s.artist === answer.artist && s.id !== answer.id),
  );
  const otherArtists = interleaveByArtist(
    rng,
    pool.filter((s) => s.artist !== answer.artist),
  );

  take(sameArtist, SAME_ARTIST_DISTRACTORS);
  // Normally 1 song; more when the artist has too few songs.
  take(otherArtists, needed - distractors.length);
  // Only reached when the category has a single artist (or very few songs).
  take(sameArtist, needed - distractors.length);

  if (distractors.length < needed) throw new NotEnoughOptionsError(answer.id);

  const songs = shuffle(rng, [answer, ...distractors]);
  return { songs, answerIndex: songs.indexOf(answer) };
}
