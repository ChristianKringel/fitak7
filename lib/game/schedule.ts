// Daily challenge schedule: 5 songs per day per category, with the options
// of every round already shuffled so everyone plays the same challenge.

import { addDays, daysBetween } from "./date";
import { buildOptions, toRoundOption, type RoundOption } from "./options";
import type { PoolSong } from "./pool";
import { answerCandidates } from "./popularity";
import { pick, seededRng, weightedPick, type Rng } from "./rng";

export const ROUNDS_PER_DAY = 5;
/** A song used on day D is avoided until D + NO_REPEAT_DAYS. */
export const NO_REPEAT_DAYS = 90;
export const DEFAULT_SCHEDULE_DAYS = 60;

export interface ScheduledRound {
  songId: string;
  trackId: number;
  altTrackIds: number[];
  title: string;
  artist: string;
  /** Already shuffled. */
  options: RoundOption[];
  answerIndex: number;
}

export interface ScheduleDay {
  rounds: ScheduledRound[];
}

export interface CategorySchedule {
  category: string;
  /** Keyed by game date (YYYY-MM-DD), sorted ascending. */
  days: Record<string, ScheduleDay>;
}

export interface ScheduleStats {
  keptDays: number;
  generatedDays: number;
  /** Rounds that had to reuse a song played less than NO_REPEAT_DAYS ago. */
  recentRepeats: number;
  /** Days that have the same artist more than once. */
  daysWithRepeatedArtist: number;
}

export interface BuildScheduleInput {
  category: string;
  pool: readonly PoolSong[];
  existing: CategorySchedule | null;
  /** Today's game date. Past days and today are never regenerated. */
  today: string;
  days?: number;
  /** Share of each artist's most popular songs that can be answers. */
  topShare?: number;
  /**
   * Never repeat an artist on the same day, even if that means reusing a
   * song played less than NO_REPEAT_DAYS ago (hits lists). By default a new
   * artist is only preferred.
   */
  uniqueArtists?: boolean;
}

function pickSong(
  rng: Rng,
  pool: readonly PoolSong[],
  weight: (song: PoolSong) => number,
  date: string,
  lastUsed: ReadonlyMap<string, string>,
  chosenToday: readonly PoolSong[],
  uniqueArtists: boolean,
): { song: PoolSong; recentRepeat: boolean } {
  const chosenIds = new Set(chosenToday.map((s) => s.id));
  const artistsToday = new Set(chosenToday.map((s) => s.artist));
  let available = pool.filter((s) => !chosenIds.has(s.id));
  if (uniqueArtists) {
    const newArtists = available.filter((s) => !artistsToday.has(s.artist));
    if (newArtists.length > 0) available = newArtists;
  }
  const preferNewArtist = (songs: PoolSong[]) => {
    const fresh = songs.filter((s) => !artistsToday.has(s.artist));
    return fresh.length > 0 ? fresh : songs;
  };

  const rested = available.filter((s) => {
    const used = lastUsed.get(s.id);
    return used === undefined || daysBetween(used, date) >= NO_REPEAT_DAYS;
  });
  if (rested.length > 0) {
    return { song: weightedPick(rng, preferNewArtist(rested), weight), recentRepeat: false };
  }

  // Pool too small for the window: reuse the least recently played songs.
  const oldest = available.reduce(
    (min, s) => {
      const used = lastUsed.get(s.id) ?? "";
      return used < min ? used : min;
    },
    "9999-12-31",
  );
  const leastRecent = available.filter((s) => (lastUsed.get(s.id) ?? "") === oldest);
  return { song: pick(rng, preferNewArtist(leastRecent)), recentRepeat: true };
}

/**
 * Keeps past days and today from `existing` and (re)generates the rest of
 * the window [today, today + days). Deterministic for the same inputs.
 */
export function buildSchedule(input: BuildScheduleInput): {
  schedule: CategorySchedule;
  stats: ScheduleStats;
} {
  const { category, pool, existing, today, topShare, uniqueArtists = false } = input;
  const totalDays = input.days ?? DEFAULT_SCHEDULE_DAYS;
  const { songs: answers, weight } = answerCandidates(pool, topShare);
  if (answers.length < ROUNDS_PER_DAY) {
    throw new Error(`Pool of ${category} has fewer than ${ROUNDS_PER_DAY} songs`);
  }

  const days: Record<string, ScheduleDay> = {};
  const lastUsed = new Map<string, string>();
  const markUsed = (date: string, rounds: ScheduledRound[]) => {
    for (const round of rounds) lastUsed.set(round.songId, date);
  };

  const existingDays = existing?.days ?? {};
  const keptDates = Object.keys(existingDays)
    .filter((date) => date <= today)
    .sort();
  for (const date of keptDates) {
    const day = existingDays[date];
    days[date] = day;
    markUsed(date, day.rounds);
  }

  const stats: ScheduleStats = {
    keptDays: keptDates.length,
    generatedDays: 0,
    recentRepeats: 0,
    daysWithRepeatedArtist: 0,
  };

  for (let offset = 0; offset < totalDays; offset++) {
    const date = addDays(today, offset);
    if (days[date]) continue;

    const rng = seededRng(`${category}:${date}`);
    const chosen: PoolSong[] = [];
    for (let i = 0; i < ROUNDS_PER_DAY; i++) {
      const { song, recentRepeat } = pickSong(rng, answers, weight, date, lastUsed, chosen, uniqueArtists);
      chosen.push(song);
      if (recentRepeat) stats.recentRepeats++;
    }
    if (new Set(chosen.map((s) => s.artist)).size < chosen.length) {
      stats.daysWithRepeatedArtist++;
    }

    const rounds = chosen.map((song): ScheduledRound => {
      const { songs, answerIndex } = buildOptions(song, pool, rng);
      return {
        songId: song.id,
        trackId: song.trackId,
        altTrackIds: song.altTrackIds,
        title: song.title,
        artist: song.artist,
        options: songs.map(toRoundOption),
        answerIndex,
      };
    });
    days[date] = { rounds };
    markUsed(date, rounds);
    stats.generatedDays++;
  }

  return { schedule: { category, days }, stats };
}
