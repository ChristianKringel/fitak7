import { describe, expect, it } from "vitest";

import { pickInfiniteSong } from "./infinite";
import { seededRng } from "./rng";

const POOL = ["a", "b", "c", "d"].map((id) => ({ id, artist: id, topPosition: 1 }));

describe("pickInfiniteSong", () => {
  it("never repeats a played song while others remain", () => {
    for (let i = 0; i < 50; i++) {
      const song = pickInfiniteSong(POOL, ["a", "b", "c"], seededRng(`s${i}`));
      expect(song.id).toBe("d");
    }
  });

  it("starts over when everything was played, avoiding the last song", () => {
    for (let i = 0; i < 50; i++) {
      const song = pickInfiniteSong(POOL, ["a", "b", "c", "d"], seededRng(`s${i}`));
      expect(song.id).not.toBe("d");
    }
  });

  it("works with a single-song pool", () => {
    expect(pickInfiniteSong([{ id: "a", artist: "A", topPosition: 1 }], ["a"], seededRng("x")).id).toBe("a");
  });

  it("only picks songs within each artist's top, favoring the most popular", () => {
    // 300 songs by one artist: its top 10% are the first 30.
    const pool = Array.from({ length: 300 }, (_, i) => ({
      id: `s${i}`,
      artist: "A",
      topPosition: i + 1,
    }));
    const counts = new Map<number, number>();
    for (let i = 0; i < 3000; i++) {
      const { topPosition } = pickInfiniteSong(pool, [], seededRng(`p${i}`));
      expect(topPosition).toBeLessThanOrEqual(30);
      counts.set(topPosition, (counts.get(topPosition) ?? 0) + 1);
    }
    const top5 = [1, 2, 3, 4, 5].reduce((n, p) => n + (counts.get(p) ?? 0), 0);
    const last5 = [26, 27, 28, 29, 30].reduce((n, p) => n + (counts.get(p) ?? 0), 0);
    expect(top5).toBeGreaterThan(last5 * 1.4);
  });
});
