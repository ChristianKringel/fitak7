// Hardcore mode: a second daily challenge per category, with other songs.
// Each round has two steps: first the player picks the artist among 4 of
// the same genre; only if right, the song among 4 of that artist, all of
// them among the artist's most popular. The clip starts at a random point
// of the preview instead of the beginning.

import {
  HARDCORE_MIN_CLIP_START,
  HARDCORE_STRONG_DECOYS,
  NORMAL_CLIP_SECONDS,
  PREVIEW_SECONDS,
} from "./config";
import { addDays } from "./date";
import { NEIGHBOR_GENRES, type Genre } from "./genres";
import { areConfusableTitles } from "./normalize";
import { NotEnoughOptionsError, OPTIONS_PER_ROUND } from "./options";
import type { DecoySong, PoolSong } from "./pool";
import { answerCandidates } from "./popularity";
import { randomInt, seededRng, shuffle, type Rng } from "./rng";
import {
  DEFAULT_SCHEDULE_DAYS,
  pickSong,
  ROUNDS_PER_DAY,
  type CategorySchedule,
  type ScheduleStats,
} from "./schedule";

/** One point for the artist, one for the song, per round. */
export const HARDCORE_POINTS_PER_ROUND = 2;
export const HARDCORE_MAX_SCORE = ROUNDS_PER_DAY * HARDCORE_POINTS_PER_ROUND;

export interface HardcoreRound {
  songId: string;
  trackId: number;
  altTrackIds: number[];
  title: string;
  artist: string;
  /** Artist names, already shuffled. */
  artistOptions: string[];
  artistAnswerIndex: number;
  /** Song titles, all by `artist`, already shuffled. */
  songOptions: string[];
  songAnswerIndex: number;
  /** Second of the preview where the clip starts. */
  clipStart: number;
}

export interface HardcoreDay {
  rounds: HardcoreRound[];
}

export interface HardcoreSchedule {
  category: string;
  /** Keyed by game date (YYYY-MM-DD), sorted ascending. */
  days: Record<string, HardcoreDay>;
}

export interface ArtistGenre {
  name: string;
  /** null: any artist of the category sounds alike (niche categories). */
  genre: Genre | null;
}

/**
 * The answer's artist plus 3 others: of the same genre when possible, then
 * of neighbor genres, then any artist of the category.
 */
export function buildArtistOptions(
  answer: string,
  artists: readonly ArtistGenre[],
  rng: Rng,
): { options: string[]; answerIndex: number } {
  const others = artists.filter((a) => a.name !== answer);
  const genre = artists.find((a) => a.name === answer)?.genre ?? null;
  const tiers: Genre[] = genre ? [genre, ...NEIGHBOR_GENRES[genre]] : [];
  const tierOf = (a: ArtistGenre) => {
    const i = a.genre ? tiers.indexOf(a.genre) : -1;
    return i === -1 ? tiers.length : i;
  };
  const ordered = shuffle(rng, others).sort((a, b) => tierOf(a) - tierOf(b));
  if (ordered.length < OPTIONS_PER_ROUND - 1) {
    throw new Error(`Not enough artists to build artist options for ${answer}`);
  }
  const options = shuffle(rng, [answer, ...ordered.slice(0, OPTIONS_PER_ROUND - 1).map((a) => a.name)]);
  return { options, answerIndex: options.indexOf(answer) };
}

type SongLike = Pick<DecoySong, "id" | "title" | "artist" | "rank">;

/**
 * The answer's artist's most popular other songs (up to
 * HARDCORE_STRONG_DECOYS), skipping versions of the answer or of each other.
 */
export function strongDecoys(answer: SongLike, songs: readonly SongLike[]): SongLike[] {
  const sameArtist = songs
    .filter((s) => s.artist === answer.artist && s.id !== answer.id)
    .sort((a, b) => b.rank - a.rank || a.id.localeCompare(b.id));
  const titles = [answer.title];
  const decoys: SongLike[] = [];
  for (const song of sameArtist) {
    if (decoys.length >= HARDCORE_STRONG_DECOYS) break;
    if (titles.some((t) => areConfusableTitles(t, song.title))) continue;
    titles.push(song.title);
    decoys.push(song);
  }
  return decoys;
}

/** The answer's title plus 3 of the artist's strong decoys, shuffled. */
export function buildSongOptions(
  answer: SongLike,
  songs: readonly SongLike[],
  rng: Rng,
): { options: string[]; answerIndex: number } {
  const decoys = strongDecoys(answer, songs);
  if (decoys.length < OPTIONS_PER_ROUND - 1) throw new NotEnoughOptionsError(answer.id);
  const picked = shuffle(rng, decoys).slice(0, OPTIONS_PER_ROUND - 1);
  const options = shuffle(rng, [answer, ...picked]).map((s) => s.title);
  return { options, answerIndex: options.indexOf(answer.title) };
}

/** A start that still fits the normal clip inside the preview. */
export function pickClipStart(rng: Rng): number {
  const latest = PREVIEW_SECONDS - NORMAL_CLIP_SECONDS;
  return HARDCORE_MIN_CLIP_START + randomInt(rng, latest - HARDCORE_MIN_CLIP_START + 1);
}

export interface BuildHardcoreScheduleInput {
  category: string;
  pool: readonly PoolSong[];
  /** Extra wrong songs for the second step (hits lists). */
  decoys?: readonly DecoySong[];
  genreOf: (artist: string) => Genre | null;
  existing: HardcoreSchedule | null;
  /** The category's daily schedule: its songs are not used on the same day. */
  daily: CategorySchedule | null;
  /** Today's game date. Past days and today are never regenerated. */
  today: string;
  days?: number;
  topShare?: number;
  /** Never repeat an artist on the same day (see `buildSchedule`). */
  uniqueArtists?: boolean;
}

/**
 * Keeps past days and today from `existing` and (re)generates the rest of
 * the window [today, today + days). Deterministic for the same inputs.
 */
export function buildHardcoreSchedule(input: BuildHardcoreScheduleInput): {
  schedule: HardcoreSchedule;
  stats: ScheduleStats;
} {
  const { category, pool, decoys = [], genreOf, existing, daily, today, topShare, uniqueArtists = false } = input;
  const totalDays = input.days ?? DEFAULT_SCHEDULE_DAYS;

  const songs: SongLike[] = [...pool, ...decoys];
  const artists: ArtistGenre[] = [...new Set(pool.map((s) => s.artist))].map((name) => ({
    name,
    genre: genreOf(name),
  }));
  const { songs: candidates, weight } = answerCandidates(pool, topShare);
  // Answers need 3 other songs of their artist for the second step.
  const answers = candidates.filter((s) => strongDecoys(s, songs).length >= OPTIONS_PER_ROUND - 1);
  if (answers.length < ROUNDS_PER_DAY) {
    throw new Error(`Pool of ${category} has fewer than ${ROUNDS_PER_DAY} hardcore answers`);
  }

  const days: Record<string, HardcoreDay> = {};
  const lastUsed = new Map<string, string>();
  const markUsed = (date: string, day: HardcoreDay) => {
    for (const round of day.rounds) lastUsed.set(round.songId, date);
  };

  const existingDays = existing?.days ?? {};
  const keptDates = Object.keys(existingDays)
    .filter((date) => date <= today)
    .sort();
  for (const date of keptDates) {
    days[date] = existingDays[date];
    markUsed(date, existingDays[date]);
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

    const rng = seededRng(`hardcore:${category}:${date}`);
    const dailyIds = new Set(daily?.days[date]?.rounds.map((r) => r.songId) ?? []);
    const notInDaily = answers.filter((s) => !dailyIds.has(s.id));
    const available = notInDaily.length >= ROUNDS_PER_DAY ? notInDaily : answers;

    const chosen: PoolSong[] = [];
    for (let i = 0; i < ROUNDS_PER_DAY; i++) {
      const { song, recentRepeat } = pickSong(rng, available, weight, date, lastUsed, chosen, uniqueArtists);
      chosen.push(song);
      if (recentRepeat) stats.recentRepeats++;
    }
    if (new Set(chosen.map((s) => s.artist)).size < chosen.length) {
      stats.daysWithRepeatedArtist++;
    }

    const rounds = chosen.map((song): HardcoreRound => {
      const artistOptions = buildArtistOptions(song.artist, artists, rng);
      const songOptions = buildSongOptions(song, songs, rng);
      return {
        songId: song.id,
        trackId: song.trackId,
        altTrackIds: song.altTrackIds,
        title: song.title,
        artist: song.artist,
        artistOptions: artistOptions.options,
        artistAnswerIndex: artistOptions.answerIndex,
        songOptions: songOptions.options,
        songAnswerIndex: songOptions.answerIndex,
        clipStart: pickClipStart(rng),
      };
    });
    days[date] = { rounds };
    markUsed(date, days[date]);
    stats.generatedDays++;
  }

  return { schedule: { category, days }, stats };
}
