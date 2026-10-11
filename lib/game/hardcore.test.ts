import { describe, expect, it } from "vitest";

import { HARDCORE_MIN_CLIP_START, NORMAL_CLIP_SECONDS, PREVIEW_SECONDS } from "./config";
import { addDays } from "./date";
import type { Genre } from "./genres";
import {
  buildArtistOptions,
  buildHardcoreSchedule,
  buildSongOptions,
  pickClipStart,
  strongDecoys,
  type ArtistGenre,
} from "./hardcore";
import { NotEnoughOptionsError } from "./options";
import type { DecoySong, PoolSong } from "./pool";
import { seededRng } from "./rng";
import { buildSchedule, ROUNDS_PER_DAY } from "./schedule";

const WORDS = ["Pedra", "Vento", "Chuva", "Campo", "Ponte", "Lua", "Rio", "Fogo", "Mar", "Serra"];

/** Distinct, non-confusable titles: "Pedra Vento Lua Mar" etc. */
function songTitle(n: number): string {
  return String(n)
    .padStart(4, "0")
    .split("")
    .map((d) => WORDS[Number(d)])
    .join(" ");
}

function makeSong(artist: number, index: number): PoolSong {
  return {
    id: `artist-${artist}--song-${index}`,
    title: songTitle(artist * 100 + index),
    artist: `Artist ${artist}`,
    artistDeezerId: artist,
    trackId: artist * 1000 + index,
    altTrackIds: [],
    album: { id: artist, title: "Album", releaseDate: "2000-01-01", recordType: "album" },
    duration: 200,
    rank: 1000 - index,
    topPosition: index + 1,
  };
}

function makePool(artists: number, songsPerArtist: number): PoolSong[] {
  return Array.from({ length: artists }, (_, a) =>
    Array.from({ length: songsPerArtist }, (_, s) => makeSong(a, s)),
  ).flat();
}

const TODAY = "2026-10-11";

describe("buildArtistOptions", () => {
  const artists: ArtistGenre[] = [
    { name: "Rock 1", genre: "rock" },
    { name: "Rock 2", genre: "rock" },
    { name: "Rock 3", genre: "rock" },
    { name: "Rock 4", genre: "rock" },
    { name: "Pop 1", genre: "pop" },
    { name: "Pop 2", genre: "pop" },
    { name: "Samba 1", genre: "samba" },
    { name: "Samba 2", genre: "samba" },
    { name: "Funk 1", genre: "funk" },
  ];

  it("offers artists of the same genre when there are enough", () => {
    for (let seed = 0; seed < 50; seed++) {
      const { options, answerIndex } = buildArtistOptions("Rock 1", artists, seededRng(`a${seed}`));
      expect(options).toHaveLength(4);
      expect(options[answerIndex]).toBe("Rock 1");
      expect(options.every((name) => name.startsWith("Rock"))).toBe(true);
    }
  });

  it("fills with neighbor genres, then any artist", () => {
    for (let seed = 0; seed < 50; seed++) {
      const { options } = buildArtistOptions("Samba 1", artists, seededRng(`b${seed}`));
      // Samba's neighbors (axé, soul) are missing: the 2 left come from anywhere.
      expect(options).toContain("Samba 2");
      expect(new Set(options).size).toBe(4);
    }
    for (let seed = 0; seed < 50; seed++) {
      const { options } = buildArtistOptions("Pop 1", artists, seededRng(`c${seed}`));
      // Pop 2, then 2 of the rock artists (rock is pop's closest neighbor).
      expect(options).toContain("Pop 2");
      expect(options.filter((name) => name.startsWith("Rock"))).toHaveLength(2);
    }
  });

  it("picks from the whole category when artists have no genre", () => {
    const niche = ["A", "B", "C", "D", "E"].map((name) => ({ name, genre: null }));
    const seen = new Set<string>();
    for (let seed = 0; seed < 50; seed++) {
      for (const name of buildArtistOptions("A", niche, seededRng(`d${seed}`)).options) seen.add(name);
    }
    expect(seen).toEqual(new Set(["A", "B", "C", "D", "E"]));
  });
});

describe("strongDecoys and buildSongOptions", () => {
  const answer = { id: "a--hit", title: "Tempo Perdido", artist: "A", rank: 900 };
  const songs = [
    answer,
    { id: "a--live", title: "Tempo Perdido (Ao Vivo)", artist: "A", rank: 950 },
    ...Array.from({ length: 10 }, (_, i) => ({ id: `a--${i}`, title: songTitle(i * 1111), artist: "A", rank: 800 - i })),
    { id: "b--x", title: "Outra", artist: "B", rank: 999 },
  ];

  it("takes the artist's most popular other songs, never a version of the answer", () => {
    const decoys = strongDecoys(answer, songs);
    expect(decoys.map((s) => s.id)).toEqual(Array.from({ length: 8 }, (_, i) => `a--${i}`));
  });

  it("builds 4 options by the answer's artist", () => {
    const strong = new Set(strongDecoys(answer, songs).map((s) => s.title));
    for (let seed = 0; seed < 30; seed++) {
      const { options, answerIndex } = buildSongOptions(answer, songs, seededRng(`s${seed}`));
      expect(options).toHaveLength(4);
      expect(options[answerIndex]).toBe("Tempo Perdido");
      expect(options.filter((t) => t !== "Tempo Perdido").every((t) => strong.has(t))).toBe(true);
    }
  });

  it("fails when the artist has too few songs", () => {
    expect(() => buildSongOptions(answer, songs.slice(0, 4), seededRng("x"))).toThrow(NotEnoughOptionsError);
  });
});

describe("pickClipStart", () => {
  it("leaves room for the normal clip", () => {
    for (let seed = 0; seed < 200; seed++) {
      const start = pickClipStart(seededRng(`t${seed}`));
      expect(start).toBeGreaterThanOrEqual(HARDCORE_MIN_CLIP_START);
      expect(start + NORMAL_CLIP_SECONDS).toBeLessThanOrEqual(PREVIEW_SECONDS);
    }
  });
});

describe("buildHardcoreSchedule", () => {
  const pool = makePool(12, 40);
  const genreOf = (artist: string): Genre | null => (Number(artist.split(" ")[1]) % 2 === 0 ? "rock" : "samba");

  it("generates days with both steps of every round", () => {
    const { schedule, stats } = buildHardcoreSchedule({
      category: "rock",
      pool,
      genreOf,
      existing: null,
      daily: null,
      today: TODAY,
      days: 10,
    });
    expect(stats.generatedDays).toBe(10);
    for (const day of Object.values(schedule.days)) {
      expect(day.rounds).toHaveLength(ROUNDS_PER_DAY);
      for (const round of day.rounds) {
        expect(round.artistOptions[round.artistAnswerIndex]).toBe(round.artist);
        expect(round.songOptions[round.songAnswerIndex]).toBe(round.title);
        const genre = genreOf(round.artist);
        expect(round.artistOptions.every((a) => genreOf(a) === genre)).toBe(true);
        const titles = new Set(pool.filter((s) => s.artist === round.artist).map((s) => s.title));
        expect(round.songOptions.every((t) => titles.has(t))).toBe(true);
      }
    }
  });

  it("avoids the songs of the daily challenge of the same day", () => {
    const { schedule: daily } = buildSchedule({ category: "rock", pool, existing: null, today: TODAY, days: 20 });
    const { schedule } = buildHardcoreSchedule({
      category: "rock",
      pool,
      genreOf,
      existing: null,
      daily,
      today: TODAY,
      days: 20,
    });
    for (const [date, day] of Object.entries(schedule.days)) {
      const dailyIds = new Set(daily.days[date].rounds.map((r) => r.songId));
      expect(day.rounds.some((r) => dailyIds.has(r.songId))).toBe(false);
    }
  });

  it("uses decoys for artists with few songs in the pool", () => {
    const hits = makePool(6, 2);
    const decoys: DecoySong[] = makePool(6, 10)
      .filter((s) => s.topPosition > 2)
      .map(({ id, title, artist, rank }) => ({ id, title, artist, rank }));
    const { schedule } = buildHardcoreSchedule({
      category: "anos-80",
      pool: hits,
      decoys,
      genreOf: () => "rock",
      existing: null,
      daily: null,
      today: TODAY,
      days: 3,
      topShare: 1,
      uniqueArtists: true,
    });
    for (const day of Object.values(schedule.days)) {
      expect(new Set(day.rounds.map((r) => r.artist)).size).toBe(ROUNDS_PER_DAY);
    }
  });

  it("keeps past days and today, and is deterministic", () => {
    const input = { category: "rock", pool, genreOf, existing: null, daily: null, today: TODAY, days: 5 };
    const first = buildHardcoreSchedule(input).schedule;
    expect(buildHardcoreSchedule(input).schedule).toEqual(first);

    const tomorrow = addDays(TODAY, 1);
    const next = buildHardcoreSchedule({ ...input, existing: first, today: tomorrow, pool: makePool(12, 41) });
    expect(next.stats.keptDays).toBe(2);
    expect(next.schedule.days[TODAY]).toEqual(first.days[TODAY]);
    expect(next.schedule.days[tomorrow]).toEqual(first.days[tomorrow]);
  });
});
