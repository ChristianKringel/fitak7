import { describe, expect, it } from "vitest";

import { addDays, daysBetween } from "./date";
import type { PoolSong } from "./pool";
import {
  buildSchedule,
  NO_REPEAT_DAYS,
  ROUNDS_PER_DAY,
  type CategorySchedule,
} from "./schedule";

const WORDS = ["Pedra", "Vento", "Chuva", "Campo", "Ponte", "Lua", "Rio", "Fogo", "Mar", "Serra"];

/** Distinct, non-confusable titles: "Pedra Vento Lua Mar" etc. */
function songTitle(n: number): string {
  return String(n)
    .padStart(4, "0")
    .split("")
    .map((d) => WORDS[Number(d)])
    .join(" ");
}

function makePool(artists: number, songsPerArtist: number): PoolSong[] {
  const pool: PoolSong[] = [];
  for (let a = 0; a < artists; a++) {
    for (let s = 0; s < songsPerArtist; s++) {
      pool.push({
        id: `artist-${a}--song-${s}`,
        title: songTitle(a * 1000 + s),
        artist: `Artist ${a}`,
        artistDeezerId: a,
        trackId: a * 1000 + s,
        altTrackIds: [],
        album: { id: a, title: "Album", releaseDate: "2000-01-01", recordType: "album" },
        duration: 200,
        rank: 1000 - s,
        topPosition: s + 1,
      });
    }
  }
  return pool;
}

const TODAY = "2026-10-06";

describe("buildSchedule", () => {
  it("generates the requested number of days starting today", () => {
    const { schedule, stats } = buildSchedule({
      category: "rock",
      pool: makePool(10, 50),
      existing: null,
      today: TODAY,
      days: 60,
    });
    const dates = Object.keys(schedule.days);
    expect(dates).toHaveLength(60);
    expect(dates[0]).toBe(TODAY);
    expect(dates[59]).toBe(addDays(TODAY, 59));
    expect(stats.generatedDays).toBe(60);
    for (const day of Object.values(schedule.days)) {
      expect(day.rounds).toHaveLength(ROUNDS_PER_DAY);
      for (const round of day.rounds) {
        expect(round.options).toHaveLength(4);
        expect(round.options[round.answerIndex]).toEqual({ title: round.title, artist: round.artist });
      }
    }
  });

  it("does not repeat songs within the no-repeat window when the pool is big enough", () => {
    const { schedule, stats } = buildSchedule({
      category: "rock",
      pool: makePool(10, 50),
      existing: null,
      today: TODAY,
      days: 120,
      topShare: 1,
    });
    expect(stats.recentRepeats).toBe(0);
    const lastSeen = new Map<string, string>();
    for (const [date, day] of Object.entries(schedule.days)) {
      for (const round of day.rounds) {
        const previous = lastSeen.get(round.songId);
        if (previous) expect(daysBetween(previous, date)).toBeGreaterThanOrEqual(NO_REPEAT_DAYS);
        lastSeen.set(round.songId, date);
      }
    }
  });

  it("avoids repeating an artist on the same day when possible", () => {
    const { schedule, stats } = buildSchedule({
      category: "rock",
      pool: makePool(6, 100),
      existing: null,
      today: TODAY,
      topShare: 1,
    });
    expect(stats.daysWithRepeatedArtist).toBe(0);
    for (const day of Object.values(schedule.days)) {
      expect(new Set(day.rounds.map((r) => r.artist)).size).toBe(ROUNDS_PER_DAY);
    }
  });

  it("still fills days when the pool is too small, reusing the least recent songs", () => {
    const { schedule, stats } = buildSchedule({
      category: "small",
      pool: makePool(2, 10),
      existing: null,
      today: TODAY,
      days: 10,
    });
    expect(Object.keys(schedule.days)).toHaveLength(10);
    expect(stats.recentRepeats).toBeGreaterThan(0);
    for (const day of Object.values(schedule.days)) {
      expect(new Set(day.rounds.map((r) => r.songId)).size).toBe(ROUNDS_PER_DAY);
    }
  });

  it("keeps past days and today, and regenerates future days", () => {
    const pool = makePool(10, 50);
    const marker = (date: string): CategorySchedule["days"][string] => ({
      rounds: [{ songId: `kept-${date}`, trackId: 1, altTrackIds: [], title: "x", artist: "y", options: [], answerIndex: 0 }],
    });
    const yesterday = addDays(TODAY, -1);
    const tomorrow = addDays(TODAY, 1);
    const existing: CategorySchedule = {
      category: "rock",
      days: { [yesterday]: marker(yesterday), [TODAY]: marker(TODAY), [tomorrow]: marker(tomorrow) },
    };

    const { schedule, stats } = buildSchedule({ category: "rock", pool, existing, today: TODAY, days: 3 });

    expect(schedule.days[yesterday]).toEqual(existing.days[yesterday]);
    expect(schedule.days[TODAY]).toEqual(existing.days[TODAY]);
    expect(schedule.days[tomorrow].rounds[0].songId).not.toBe(`kept-${tomorrow}`);
    expect(Object.keys(schedule.days)).toEqual([yesterday, TODAY, tomorrow, addDays(TODAY, 2)]);
    expect(stats).toMatchObject({ keptDays: 2, generatedDays: 2 });
  });

  it("takes kept days into account for the no-repeat window", () => {
    const pool = makePool(10, 50);
    const first = buildSchedule({ category: "rock", pool, existing: null, today: TODAY, days: 1, topShare: 1 });
    const todaySongs = new Set(first.schedule.days[TODAY].rounds.map((r) => r.songId));
    const next = buildSchedule({
      category: "rock",
      pool,
      existing: first.schedule,
      today: TODAY,
      days: 60,
      topShare: 1,
    });
    for (const [date, day] of Object.entries(next.schedule.days)) {
      if (date === TODAY) continue;
      for (const round of day.rounds) expect(todaySongs.has(round.songId)).toBe(false);
    }
  });

  it("is deterministic and stable across runs on later days", () => {
    const pool = makePool(10, 50);
    const a = buildSchedule({ category: "rock", pool, existing: null, today: TODAY, days: 10 });
    const b = buildSchedule({ category: "rock", pool, existing: null, today: TODAY, days: 10 });
    expect(a.schedule).toEqual(b.schedule);

    // Running again tomorrow does not change the days already planned.
    const tomorrow = addDays(TODAY, 1);
    const c = buildSchedule({ category: "rock", pool, existing: a.schedule, today: tomorrow, days: 9 });
    for (let i = 0; i < 10; i++) {
      const date = addDays(TODAY, i);
      expect(c.schedule.days[date]).toEqual(a.schedule.days[date]);
    }
  });

  it("only picks answers among each artist's most popular songs", () => {
    const { schedule } = buildSchedule({
      category: "rock",
      pool: makePool(10, 50),
      existing: null,
      today: TODAY,
      days: 30,
      topShare: 0.2,
    });
    for (const day of Object.values(schedule.days)) {
      for (const round of day.rounds) {
        const position = Number(round.songId.split("--song-")[1]) + 1;
        expect(position).toBeLessThanOrEqual(10);
      }
    }
  });
});
