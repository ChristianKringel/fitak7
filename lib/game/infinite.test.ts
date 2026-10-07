import { describe, expect, it } from "vitest";

import { pickInfiniteSong } from "./infinite";
import { seededRng } from "./rng";

const POOL = ["a", "b", "c", "d"].map((id) => ({ id }));

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
    expect(pickInfiniteSong([{ id: "a" }], ["a"], seededRng("x")).id).toBe("a");
  });
});
