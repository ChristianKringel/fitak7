import { describe, expect, it } from "vitest";

import { MIN_TOP_SONGS_PER_ARTIST } from "./config";
import { answerCandidates, topCutoff } from "./popularity";

const ranked = (artist: string, count: number) =>
  Array.from({ length: count }, (_, i) => ({ artist, topPosition: i + 1 }));

describe("topCutoff", () => {
  it("is the share of the artist's songs, rounded up", () => {
    expect(topCutoff(250, 0.1)).toBe(25);
    expect(topCutoff(101, 0.1)).toBe(11);
  });

  it("never goes below the minimum nor above the song count", () => {
    expect(topCutoff(16, 0.1)).toBe(MIN_TOP_SONGS_PER_ARTIST);
    expect(topCutoff(2, 0.1)).toBe(2);
  });
});

describe("answerCandidates", () => {
  it("keeps only each artist's top share", () => {
    const pool = [...ranked("A", 100), ...ranked("B", 40)];
    const { songs } = answerCandidates(pool, 0.1);
    expect(songs.filter((s) => s.artist === "A").map((s) => s.topPosition)).toEqual(
      Array.from({ length: 10 }, (_, i) => i + 1),
    );
    expect(songs.filter((s) => s.artist === "B")).toHaveLength(4);
  });

  it("weighs each artist's #1 twice as much as the song at the cut", () => {
    const pool = ranked("A", 300);
    const { weight } = answerCandidates(pool, 0.1);
    expect(weight(pool[0])).toBe(2);
    expect(weight(pool[14])).toBeGreaterThan(weight(pool[15]));
    expect(weight(pool[29])).toBeGreaterThan(1);
  });
});
