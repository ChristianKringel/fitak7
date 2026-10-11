import { describe, expect, it } from "vitest";

import {
  dailyProgress,
  defaultGameState,
  hardcoreDayScore,
  hardcoreProgress,
  isHardcoreDayFinished,
  recordHardcoreStep,
  isDayFinished,
  parseGameState,
  recordDailyGame,
  recordDailyRound,
  recordInfiniteAnswer,
  recordInfiniteRound,
  setHardMode,
  emptyCategoryStats,
  type GameState,
  type RoundRecord,
} from "./progress";

const record = (correct: boolean): RoundRecord => ({
  choice: correct ? 1 : 0,
  answerIndex: 1,
  correct,
  hard: false,
  answer: { title: "Infinita Highway", artist: "Engenheiros do Hawaii", album: null, cover: null, link: null },
});

function playDay(state: GameState, category: string, date: string, results: boolean[]): GameState {
  return results.reduce(
    (s, correct, index) =>
      recordDailyRound(s, { category, date, index, totalRounds: results.length, record: record(correct) }),
    state,
  );
}

describe("recordDailyRound", () => {
  it("stores answers and updates stats only when the day is finished", () => {
    let state = defaultGameState();
    state = recordDailyRound(state, {
      category: "rock",
      date: "2026-10-06",
      index: 0,
      totalRounds: 5,
      record: record(true),
    });
    expect(dailyProgress(state, "rock", "2026-10-06").rounds[0]?.correct).toBe(true);
    expect(state.stats.rock.daily.played).toBe(0);

    state = playDay(state, "rock", "2026-10-06", [true, false, true, true, false]);
    const progress = dailyProgress(state, "rock", "2026-10-06");
    expect(isDayFinished(progress)).toBe(true);
    expect(state.stats.rock.daily).toMatchObject({
      played: 1,
      correct: 3,
      currentStreak: 1,
      distribution: [0, 0, 0, 1, 0, 0],
      lastPlayedDate: "2026-10-06",
    });
  });

  it("does not let a round be answered twice", () => {
    const once = playDay(defaultGameState(), "rock", "2026-10-06", [true, true, true, true, true]);
    const again = recordDailyRound(once, {
      category: "rock",
      date: "2026-10-06",
      index: 0,
      totalRounds: 5,
      record: record(false),
    });
    expect(again).toBe(once);
  });

  it("drops progress older than two weeks", () => {
    let state = playDay(defaultGameState(), "rock", "2026-09-01", [true, true, true, true, true]);
    state = playDay(state, "rock", "2026-10-06", [true, true, true, true, true]);
    expect(Object.keys(state.daily.rock)).toEqual(["2026-10-06"]);
    expect(state.stats.rock.daily.played).toBe(2);
  });
});

describe("recordDailyGame", () => {
  const base = emptyCategoryStats().daily;

  it("counts streaks of consecutive days", () => {
    let stats = recordDailyGame(base, "2026-10-05", 2);
    stats = recordDailyGame(stats, "2026-10-06", 5);
    expect(stats).toMatchObject({ played: 2, correct: 7, currentStreak: 2, maxStreak: 2 });
    stats = recordDailyGame(stats, "2026-10-08", 1);
    expect(stats).toMatchObject({ currentStreak: 1, maxStreak: 2 });
  });

  it("ignores a day already counted", () => {
    const stats = recordDailyGame(base, "2026-10-06", 2);
    expect(recordDailyGame(stats, "2026-10-06", 5)).toBe(stats);
  });
});

describe("recordInfiniteAnswer", () => {
  it("counts consecutive correct answers", () => {
    let stats = emptyCategoryStats().infinite;
    for (const correct of [true, true, true, false, true]) {
      stats = recordInfiniteAnswer(stats, correct);
    }
    expect(stats).toEqual({ played: 5, correct: 4, currentStreak: 1, maxStreak: 3 });
  });

  it("is kept per category", () => {
    let state = recordInfiniteRound(defaultGameState(), "rock", true);
    state = recordInfiniteRound(state, "bandinhas", false);
    expect(state.stats.rock.infinite.correct).toBe(1);
    expect(state.stats.bandinhas.infinite.correct).toBe(0);
  });
});

describe("parseGameState", () => {
  it("falls back to defaults on missing or corrupted data", () => {
    expect(parseGameState(null)).toEqual(defaultGameState());
    expect(parseGameState("garbage")).toEqual(defaultGameState());
    expect(parseGameState({ version: 99 })).toEqual(defaultGameState());
  });

  it("round-trips a valid state through JSON", () => {
    let state = setHardMode(defaultGameState(), true);
    state = playDay(state, "rock", "2026-10-06", [true, false, true, true, true]);
    state = recordInfiniteRound(state, "rock", true);
    expect(parseGameState(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });

  it("keeps valid parts and drops broken ones", () => {
    const valid = playDay(defaultGameState(), "rock", "2026-10-06", [true, true, true, true, true]);
    const raw = JSON.parse(JSON.stringify(valid));
    raw.preferences = "oops";
    raw.stats.broken = { daily: { played: -1 } };
    raw.daily.rock["2026-10-06"].rounds[2] = { choice: "x" };
    const parsed = parseGameState(raw);
    expect(parsed.preferences.hardMode).toBe(false);
    expect(parsed.stats.rock).toEqual(valid.stats.rock);
    expect(parsed.stats.broken).toBeUndefined();
    expect(parsed.daily.rock["2026-10-06"].rounds[2]).toBeNull();
    expect(parsed.daily.rock["2026-10-06"].rounds[0]).toEqual(valid.daily.rock["2026-10-06"].rounds[0]);
  });
});

describe("recordHardcoreStep", () => {
  const answer = record(true).answer;
  const base = { category: "rock", date: "2026-10-11", totalRounds: 5, hard: false };

  /** Plays a round: "wrong" artist, "artist" only, or "both" right. */
  function playRound(state: GameState, index: number, result: "wrong" | "artist" | "both"): GameState {
    if (result === "wrong") {
      return recordHardcoreStep(state, { ...base, index, step: "artist", choice: 0, answerIndex: 1, songs: null, answer });
    }
    const songs = ["A", "B", "C", "D"];
    const afterArtist = recordHardcoreStep(state, {
      ...base,
      index,
      step: "artist",
      choice: 1,
      answerIndex: 1,
      songs,
      answer: null,
    });
    return recordHardcoreStep(afterArtist, {
      ...base,
      index,
      step: "song",
      choice: result === "both" ? 2 : 3,
      answerIndex: 2,
      answer,
    });
  }

  it("scores 1 point per right artist and 1 more per right song", () => {
    let state = defaultGameState();
    (["both", "artist", "wrong", "both", "both"] as const).forEach((result, i) => {
      state = playRound(state, i, result);
    });
    const progress = hardcoreProgress(state, "rock", "2026-10-11");
    expect(isHardcoreDayFinished(progress)).toBe(true);
    expect(hardcoreDayScore(progress)).toBe(7);
    expect(state.stats.rock.hardcore).toMatchObject({ played: 1, correct: 7, currentStreak: 1 });
    expect(state.stats.rock.hardcore.distribution[7]).toBe(1);
    expect(state.stats.rock.daily.played).toBe(0);
  });

  it("keeps a round open between the steps and accepts each step once", () => {
    const afterArtist = recordHardcoreStep(defaultGameState(), {
      ...base,
      index: 0,
      step: "artist",
      choice: 1,
      answerIndex: 1,
      songs: ["A", "B", "C", "D"],
      answer: null,
    });
    const progress = hardcoreProgress(afterArtist, "rock", "2026-10-11");
    expect(progress.rounds[0]?.answer).toBeNull();
    expect(isHardcoreDayFinished(progress)).toBe(false);

    const again = recordHardcoreStep(afterArtist, {
      ...base,
      index: 0,
      step: "artist",
      choice: 0,
      answerIndex: 1,
      songs: null,
      answer,
    });
    expect(again).toBe(afterArtist);

    const wrong = playRound(defaultGameState(), 0, "wrong");
    expect(
      recordHardcoreStep(wrong, { ...base, index: 0, step: "song", choice: 0, answerIndex: 0, answer }),
    ).toBe(wrong);
  });

  it("survives a round trip through storage", () => {
    const state = playRound(playRound(defaultGameState(), 0, "both"), 1, "wrong");
    expect(parseGameState(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });
});
