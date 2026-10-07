// Player state kept in the browser: daily progress, stats and preferences.
// Pure transitions; persistence lives in lib/storage.

import type { RevealedAnswer } from "@/lib/api/types";

import { addDays } from "./date";
import { ROUNDS_PER_DAY } from "./schedule";

export const GAME_STATE_VERSION = 1;
/** Daily progress older than this many days is dropped from storage. */
const DAILY_PROGRESS_KEEP_DAYS = 14;

export interface RoundRecord {
  choice: number;
  answerIndex: number;
  correct: boolean;
  /** Played with hard mode on. */
  hard: boolean;
  answer: RevealedAnswer;
}

export interface DailyProgress {
  /** One entry per round; null while unanswered. */
  rounds: (RoundRecord | null)[];
}

export interface ModeStats {
  played: number;
  correct: number;
  currentStreak: number;
  maxStreak: number;
}

/**
 * Daily: `played` counts finished days, `correct` counts correct rounds,
 * streaks count consecutive days played, `distribution[n]` counts days
 * finished with n correct answers.
 */
export interface DailyStats extends ModeStats {
  distribution: number[];
  lastPlayedDate: string | null;
}

/** Infinite: `played`/`correct` count rounds, streaks count consecutive correct answers. */
export type InfiniteStats = ModeStats;

export interface CategoryStats {
  daily: DailyStats;
  infinite: InfiniteStats;
}

export interface GameState {
  version: typeof GAME_STATE_VERSION;
  preferences: { hardMode: boolean };
  daily: Record<string, Record<string, DailyProgress>>;
  stats: Record<string, CategoryStats>;
}

export function defaultGameState(): GameState {
  return {
    version: GAME_STATE_VERSION,
    preferences: { hardMode: false },
    daily: {},
    stats: {},
  };
}

function emptyModeStats(): ModeStats {
  return { played: 0, correct: 0, currentStreak: 0, maxStreak: 0 };
}

export function emptyCategoryStats(): CategoryStats {
  return {
    daily: {
      ...emptyModeStats(),
      distribution: Array.from({ length: ROUNDS_PER_DAY + 1 }, () => 0),
      lastPlayedDate: null,
    },
    infinite: emptyModeStats(),
  };
}

export function categoryStats(state: GameState, category: string): CategoryStats {
  return state.stats[category] ?? emptyCategoryStats();
}

export function dailyProgress(
  state: GameState,
  category: string,
  date: string,
  rounds = ROUNDS_PER_DAY,
): DailyProgress {
  const stored = state.daily[category]?.[date];
  return {
    rounds: Array.from({ length: rounds }, (_, i) => stored?.rounds[i] ?? null),
  };
}

export function isDayFinished(progress: DailyProgress): boolean {
  return progress.rounds.every((r) => r !== null);
}

export function dayScore(progress: DailyProgress): number {
  return progress.rounds.filter((r) => r?.correct).length;
}

export function recordDailyGame(stats: DailyStats, date: string, score: number): DailyStats {
  if (stats.lastPlayedDate !== null && date <= stats.lastPlayedDate) return stats;
  const continues = stats.lastPlayedDate === addDays(date, -1);
  const currentStreak = continues ? stats.currentStreak + 1 : 1;
  const distribution = [...stats.distribution];
  distribution[score] = (distribution[score] ?? 0) + 1;
  return {
    played: stats.played + 1,
    correct: stats.correct + score,
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    distribution,
    lastPlayedDate: date,
  };
}

export function recordInfiniteAnswer(stats: InfiniteStats, correct: boolean): InfiniteStats {
  const currentStreak = correct ? stats.currentStreak + 1 : 0;
  return {
    played: stats.played + 1,
    correct: stats.correct + (correct ? 1 : 0),
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
  };
}

function pruneDaily(
  byDate: Record<string, DailyProgress>,
  today: string,
): Record<string, DailyProgress> {
  const cutoff = addDays(today, -DAILY_PROGRESS_KEEP_DAYS);
  return Object.fromEntries(Object.entries(byDate).filter(([date]) => date >= cutoff));
}

/**
 * Stores the answer of a daily round (ignored if already answered) and,
 * when it completes the day, updates the daily stats.
 */
export function recordDailyRound(
  state: GameState,
  input: { category: string; date: string; index: number; totalRounds: number; record: RoundRecord },
): GameState {
  const { category, date, index, totalRounds, record } = input;
  const progress = dailyProgress(state, category, date, totalRounds);
  if (index < 0 || index >= totalRounds || progress.rounds[index]) return state;

  const rounds = [...progress.rounds];
  rounds[index] = record;
  const updated: DailyProgress = { rounds };

  const stats = categoryStats(state, category);
  const nextStats = isDayFinished(updated)
    ? { ...stats, daily: recordDailyGame(stats.daily, date, dayScore(updated)) }
    : stats;

  return {
    ...state,
    daily: {
      ...state.daily,
      [category]: pruneDaily({ ...state.daily[category], [date]: updated }, date),
    },
    stats: { ...state.stats, [category]: nextStats },
  };
}

export function recordInfiniteRound(state: GameState, category: string, correct: boolean): GameState {
  const stats = categoryStats(state, category);
  return {
    ...state,
    stats: {
      ...state.stats,
      [category]: { ...stats, infinite: recordInfiniteAnswer(stats.infinite, correct) },
    },
  };
}

export function setHardMode(state: GameState, hardMode: boolean): GameState {
  return { ...state, preferences: { ...state.preferences, hardMode } };
}

// --- Parsing untrusted storage -------------------------------------------

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;
const isStr = (v: unknown): v is string => typeof v === "string";
const isStrOrNull = (v: unknown): v is string | null => v === null || isStr(v);

function parseAnswer(v: unknown): RevealedAnswer | null {
  if (!isObj(v) || !isStr(v.title) || !isStr(v.artist)) return null;
  if (!isStrOrNull(v.album) || !isStrOrNull(v.cover) || !isStrOrNull(v.link)) return null;
  return { title: v.title, artist: v.artist, album: v.album, cover: v.cover, link: v.link };
}

function parseRound(v: unknown): RoundRecord | null {
  if (!isObj(v) || !isCount(v.choice) || !isCount(v.answerIndex)) return null;
  if (typeof v.correct !== "boolean" || typeof v.hard !== "boolean") return null;
  const answer = parseAnswer(v.answer);
  return answer
    ? { choice: v.choice, answerIndex: v.answerIndex, correct: v.correct, hard: v.hard, answer }
    : null;
}

function parseModeStats(v: unknown): ModeStats | null {
  if (!isObj(v)) return null;
  const { played, correct, currentStreak, maxStreak } = v;
  if (![played, correct, currentStreak, maxStreak].every(isCount)) return null;
  return {
    played: played as number,
    correct: correct as number,
    currentStreak: currentStreak as number,
    maxStreak: maxStreak as number,
  };
}

function parseCategoryStats(v: unknown): CategoryStats | null {
  if (!isObj(v) || !isObj(v.daily)) return null;
  const daily = parseModeStats(v.daily);
  const infinite = parseModeStats(v.infinite);
  const { distribution, lastPlayedDate } = v.daily;
  if (!daily || !infinite || !isStrOrNull(lastPlayedDate)) return null;
  if (!Array.isArray(distribution) || !distribution.every(isCount)) return null;
  const fullDistribution = emptyCategoryStats().daily.distribution.map(
    (_, i) => (distribution[i] as number | undefined) ?? 0,
  );
  return { daily: { ...daily, distribution: fullDistribution, lastPlayedDate }, infinite };
}

/**
 * Reads state from untrusted JSON (localStorage). Anything missing or
 * malformed falls back to defaults, piece by piece.
 */
export function parseGameState(raw: unknown): GameState {
  const state = defaultGameState();
  if (!isObj(raw) || raw.version !== GAME_STATE_VERSION) return state;

  if (isObj(raw.preferences) && typeof raw.preferences.hardMode === "boolean") {
    state.preferences.hardMode = raw.preferences.hardMode;
  }
  if (isObj(raw.daily)) {
    for (const [category, byDate] of Object.entries(raw.daily)) {
      if (!isObj(byDate)) continue;
      for (const [date, progress] of Object.entries(byDate)) {
        if (!isObj(progress) || !Array.isArray(progress.rounds)) continue;
        (state.daily[category] ??= {})[date] = { rounds: progress.rounds.map(parseRound) };
      }
    }
  }
  if (isObj(raw.stats)) {
    for (const [category, stats] of Object.entries(raw.stats)) {
      const parsed = parseCategoryStats(stats);
      if (parsed) state.stats[category] = parsed;
    }
  }
  return state;
}
