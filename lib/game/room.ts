// Multiplayer rooms ("Modo Desafio"): everyone in a room plays the same songs
// with the same options, each at their own pace. Ranking: most points (one
// per right answer; in hardcore rooms, one for the artist and one for the
// song), then the shortest total time.

import type { Genre } from "./genres";
import {
  buildArtistOptions,
  buildSongOptions,
  HARDCORE_POINTS_PER_ROUND,
  pickClipStart,
  strongDecoys,
  type HardcoreRound,
} from "./hardcore";
import { buildOptions, OPTIONS_PER_ROUND, toRoundOption } from "./options";
import type { DecoySong, PoolSong } from "./pool";
import { answerCandidates } from "./popularity";
import { randomInt, weightedPick, type Rng } from "./rng";
import type { ScheduledRound } from "./schedule";

export const MIN_ROOM_ROUNDS = 5;
export const MAX_ROOM_ROUNDS = 20;
export const DEFAULT_ROOM_ROUNDS = 10;
export const MAX_ROOM_PLAYERS = 20;
export const ROOM_TTL_MS = 3 * 24 * 60 * 60 * 1000;
export const MAX_NICKNAME_LENGTH = 20;

/** No 0/O, 1/I/L: codes are read aloud and typed on phones. */
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 6;

export interface RoomSettings {
  category: string;
  roundCount: number;
  /** Always on in hardcore rooms. */
  hardMode: boolean;
  /** Artist first, then the song (see lib/game/hardcore.ts). Missing in older rooms. */
  hardcore?: boolean;
}

interface RoomBase extends RoomSettings {
  code: string;
  /** ms since epoch. */
  createdAt: number;
  expiresAt: number;
}

/** Rounds are already shuffled, the same for every player. */
export type Room = RoomBase &
  ({ hardcore?: false; rounds: ScheduledRound[] } | { hardcore: true; rounds: HardcoreRound[] });

/** Best possible score of a room. */
export function roomMaxScore(room: Pick<RoomSettings, "roundCount" | "hardcore">): number {
  return room.roundCount * (room.hardcore ? HARDCORE_POINTS_PER_ROUND : 1);
}

export function generateRoomCode(rng: Rng): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[randomInt(rng, ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

/** Uppercases and drops separators; null when it can't be a room code. */
export function parseRoomCode(input: string): string | null {
  const code = input.toUpperCase().replace(/[\s-]/g, "");
  const valid =
    code.length === ROOM_CODE_LENGTH && [...code].every((c) => ROOM_CODE_ALPHABET.includes(c));
  return valid ? code : null;
}

export function isValidRoundCount(value: unknown): value is number {
  return (
    Number.isInteger(value) && (value as number) >= MIN_ROOM_ROUNDS && (value as number) <= MAX_ROOM_ROUNDS
  );
}

/** Trims and collapses spaces; null when empty or too long. */
export function cleanNickname(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const name = input.trim().replace(/\s+/g, " ");
  return name.length > 0 && [...name].length <= MAX_NICKNAME_LENGTH ? name : null;
}

/** Nicknames that differ only by case or accents count as the same. */
export function nicknameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Picks `count` different songs among the candidates, avoiding repeated
 * artists while possible.
 */
function pickRoomSongs(
  candidates: readonly PoolSong[],
  weight: (song: PoolSong) => number,
  count: number,
  rng: Rng,
): PoolSong[] {
  if (candidates.length < count) {
    throw new Error(`Only ${candidates.length} answer candidates for ${count} rounds`);
  }

  const chosen: PoolSong[] = [];
  const chosenIds = new Set<string>();
  const artists = new Set<string>();
  for (let i = 0; i < count; i++) {
    const available = candidates.filter((s) => !chosenIds.has(s.id));
    const fresh = available.filter((s) => !artists.has(s.artist));
    const song = weightedPick(rng, fresh.length > 0 ? fresh : available, weight);
    chosen.push(song);
    chosenIds.add(song.id);
    artists.add(song.artist);
    // Once every artist was used, start a new cycle over all of them.
    if (fresh.length <= 1) artists.clear();
  }
  return chosen;
}

/**
 * Picks `count` different songs among each artist's most popular ones,
 * avoiding repeated artists while possible, and builds their options.
 */
export function buildRoomRounds(
  pool: readonly PoolSong[],
  count: number,
  rng: Rng,
  topShare?: number,
): ScheduledRound[] {
  const { songs: candidates, weight } = answerCandidates(pool, topShare);
  return pickRoomSongs(candidates, weight, count, rng).map((song) => {
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
}

export interface HardcoreRoomInput {
  pool: readonly PoolSong[];
  /** Extra wrong songs for the second step (hits lists). */
  decoys?: readonly DecoySong[];
  genreOf: (artist: string) => Genre | null;
  topShare?: number;
}

/** Hardcore rooms: like `buildRoomRounds`, with both steps of every round. */
export function buildRoomHardcoreRounds(input: HardcoreRoomInput, count: number, rng: Rng): HardcoreRound[] {
  const { pool, decoys = [], genreOf, topShare } = input;
  const songs = [...pool, ...decoys];
  const artists = [...new Set(pool.map((s) => s.artist))].map((name) => ({ name, genre: genreOf(name) }));
  const { songs: candidates, weight } = answerCandidates(pool, topShare);
  const answers = candidates.filter((s) => strongDecoys(s, songs).length >= OPTIONS_PER_ROUND - 1);

  return pickRoomSongs(answers, weight, count, rng).map((song) => {
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
}

export interface PlayerAnswer {
  /** 0 or 1; in hardcore rooms 0 to 2 (artist, then song). */
  points: number;
  /** Time spent on the round, ms. */
  elapsedMs: number;
}

/**
 * Time of a round, measured on the server: from the first time its audio was
 * requested to the guess. Without an audio request (e.g. it failed), counts
 * from the previous guess, or from when the player joined.
 */
export function roundElapsedMs(input: {
  answeredAt: number;
  audioStartedAt: number | null;
  previousAnsweredAt: number | null;
  joinedAt: number;
}): number {
  const start = input.audioStartedAt ?? input.previousAnsweredAt ?? input.joinedAt;
  return Math.max(0, input.answeredAt - start);
}

export interface PlayerProgress {
  /** Opaque id, passed through to the standing. */
  id: string;
  name: string;
  joinedAt: number;
  /** In round order; stops at the first unanswered round. */
  answers: PlayerAnswer[];
}

export interface Standing {
  id: string;
  name: string;
  answered: number;
  points: number;
  totalMs: number;
  finished: boolean;
  /** 1-based, shared on exact ties; null while still playing. */
  position: number | null;
}

/**
 * Finished players ranked by points, then total time. Players still
 * playing come after them, most advanced first, without a position.
 */
export function rankPlayers(players: readonly PlayerProgress[], roundCount: number): Standing[] {
  const scored = players.map((p): { joinedAt: number; standing: Standing } => ({
    joinedAt: p.joinedAt,
    standing: {
      id: p.id,
      name: p.name,
      answered: p.answers.length,
      points: p.answers.reduce((sum, a) => sum + a.points, 0),
      totalMs: p.answers.reduce((sum, a) => sum + a.elapsedMs, 0),
      finished: p.answers.length >= roundCount,
      position: null,
    },
  }));
  const finished = scored
    .filter((s) => s.standing.finished)
    .sort(
      (a, b) =>
        b.standing.points - a.standing.points ||
        a.standing.totalMs - b.standing.totalMs ||
        a.joinedAt - b.joinedAt,
    )
    .map((s) => s.standing);
  const playing = scored
    .filter((s) => !s.standing.finished)
    .sort(
      (a, b) =>
        b.standing.answered - a.standing.answered ||
        b.standing.points - a.standing.points ||
        a.joinedAt - b.joinedAt,
    )
    .map((s) => s.standing);

  finished.forEach((s, i) => {
    const prev = finished[i - 1];
    const tied = prev !== undefined && prev.points === s.points && prev.totalMs === s.totalMs;
    s.position = tied ? prev.position : i + 1;
  });
  return [...finished, ...playing];
}

/** "42s", "3min 05s". */
export function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}min ${String(seconds % 60).padStart(2, "0")}s`;
}
