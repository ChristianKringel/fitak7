// Builds the 4 options of a round: the answer plus a random mix of songs by
// the same artist and by other artists of the category (see `OPTION_PLANS`),
// falling back to whatever is available. At most 2 options share an artist,
// unless the category has too few artists. Options are compared with
// `areConfusableTitles`, so no option can be another version of the answer
// or look like another option. Distractors are preferably as popular as the
// answer, so a well-known title can't be spotted just because the others are
// obscure.

import { areConfusableTitles } from "./normalize";
import type { PoolSong } from "./pool";
import { shuffle, weightedPick, type Rng } from "./rng";

export const OPTIONS_PER_ROUND = 4;
/** Songs within this many positions of the answer count as equally popular. */
export const SIMILAR_POPULARITY_WINDOW = 5;

export type OptionSong = Pick<PoolSong, "id" | "title" | "artist" | "topPosition">;

/** What the player sees of each option. */
export interface RoundOption {
  title: string;
  artist: string;
}

export function toRoundOption({ title, artist }: OptionSong): RoundOption {
  return { title, artist };
}

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

/** No artist has more than this many options in a round. */
export const MAX_OPTIONS_PER_ARTIST = 2;

export type OptionPlan =
  /** One wrong option by the answer's artist. */
  | { sameArtist: 1; bait: false }
  /** No wrong option by the answer's artist; `bait` adds 2 by one other artist. */
  | { sameArtist: 0; bait: boolean };

/** Possible mixes and their weights (artists' option counts in comments). */
export const OPTION_PLANS: readonly { plan: OptionPlan; weight: number }[] = [
  { plan: { sameArtist: 1, bait: false }, weight: 30 }, // 2 + 1 + 1
  { plan: { sameArtist: 0, bait: true }, weight: 40 }, // 1 + 2 + 1
  { plan: { sameArtist: 0, bait: false }, weight: 30 }, // 1 + 1 + 1 + 1
];

export function pickOptionPlan(rng: Rng): OptionPlan {
  return weightedPick(rng, OPTION_PLANS, (p) => p.weight).plan;
}

/** 0 for songs about as popular as the answer, growing with the distance. */
function popularityDistance(answer: OptionSong, song: OptionSong): number {
  const diff = Math.abs(song.topPosition - answer.topPosition);
  return Math.floor(Math.max(diff - 1, 0) / SIMILAR_POPULARITY_WINDOW);
}

/** Shuffled, then stably ordered by popularity distance to the answer. */
function similarFirst<T extends OptionSong>(rng: Rng, answer: T, songs: T[]): T[] {
  return shuffle(rng, songs).sort(
    (a, b) => popularityDistance(answer, a) - popularityDistance(answer, b),
  );
}

export function buildOptions<T extends OptionSong>(
  answer: T,
  pool: readonly T[],
  rng: Rng,
): RoundOptions<T> {
  const usedTitles = [answer.title];
  const distractors: T[] = [];
  const needed = OPTIONS_PER_ROUND - 1;
  const perArtist = new Map([[answer.artist, 1]]);

  const fits = (song: T) => !usedTitles.some((t) => areConfusableTitles(t, song.title));
  const add = (song: T) => {
    usedTitles.push(song.title);
    distractors.push(song);
    perArtist.set(song.artist, (perArtist.get(song.artist) ?? 0) + 1);
  };
  const take = (candidates: T[], count: number, maxPerArtist = MAX_OPTIONS_PER_ARTIST) => {
    let taken = 0;
    for (const song of candidates) {
      if (taken >= count || distractors.length >= needed) return;
      if ((perArtist.get(song.artist) ?? 0) >= maxPerArtist || !fits(song)) continue;
      add(song);
      taken++;
    }
  };
  /** Two songs by the first artist (in `candidates` order) that has them. */
  const takeBait = (candidates: T[]) => {
    for (const artist of new Set(candidates.map((s) => s.artist))) {
      if (perArtist.has(artist)) continue;
      const first = candidates.find((s) => s.artist === artist && fits(s));
      if (!first) continue;
      const second = candidates.find(
        (s) => s.artist === artist && s !== first && fits(s) && !areConfusableTitles(s.title, first.title),
      );
      if (second) {
        add(first);
        add(second);
        return;
      }
    }
  };

  const sameArtist = similarFirst(
    rng,
    answer,
    pool.filter((s) => s.artist === answer.artist && s.id !== answer.id),
  );
  const others = pool.filter((s) => s.artist !== answer.artist);
  const isSimilar = (s: T) => popularityDistance(answer, s) === 0;
  const otherArtists = [
    ...interleaveByArtist(rng, others.filter(isSimilar)),
    ...interleaveByArtist(rng, others.filter((s) => !isSimilar(s))),
  ];

  const plan = pickOptionPlan(rng);
  take(sameArtist, plan.sameArtist);
  if (plan.bait) takeBait(otherArtists);
  // One song per artist from here on, so the plan's mix isn't changed.
  take(otherArtists, needed - distractors.length, 1);
  // Only reached when the category has too few artists (or songs).
  take(otherArtists, needed - distractors.length);
  take(sameArtist, needed - distractors.length);
  take(sameArtist, needed - distractors.length, Infinity);

  if (distractors.length < needed) throw new NotEnoughOptionsError(answer.id);

  const songs = shuffle(rng, [answer, ...distractors]);
  return { songs, answerIndex: songs.indexOf(answer) };
}
