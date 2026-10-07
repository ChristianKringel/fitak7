import { describe, expect, it } from "vitest";

import { answerCandidates, popularityWeight } from "./popularity";

const at = (topPosition: number) => ({ topPosition });

describe("answerCandidates", () => {
  it("keeps only songs within the top", () => {
    const pool = [1, 2, 3, 4, 5].map(at);
    expect(answerCandidates(pool, 3)).toEqual([at(1), at(2), at(3)]);
  });
});

describe("popularityWeight", () => {
  it("decreases with the position, from 2 down to just above 1", () => {
    expect(popularityWeight(at(1), 30)).toBe(2);
    expect(popularityWeight(at(15), 30)).toBeGreaterThan(popularityWeight(at(16), 30));
    expect(popularityWeight(at(30), 30)).toBeGreaterThan(1);
  });
});
