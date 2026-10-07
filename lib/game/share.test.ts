import { describe, expect, it } from "vitest";

import { resultEmojis, shareText } from "./share";

describe("shareText", () => {
  it("builds the shareable result", () => {
    const text = shareText({
      categoryName: "Rock Gaúcho",
      date: "2026-10-06",
      results: [true, false, true, true, true],
      hardMode: false,
      url: "https://example.com/rock-gaucho",
    });
    expect(text).toBe(
      "Fita K7 · Rock Gaúcho\n06/10/2026 · 4/5\n🟩🟥🟩🟩🟩\nhttps://example.com/rock-gaucho",
    );
  });

  it("marks hard mode and works without url", () => {
    const text = shareText({
      categoryName: "Bandinhas",
      date: "2026-10-06",
      results: [false, false, false, false, false],
      hardMode: true,
    });
    expect(text).toBe("Fita K7 · Bandinhas\n06/10/2026 · 0/5 · modo difícil 🔥\n🟥🟥🟥🟥🟥");
  });
});

describe("resultEmojis", () => {
  it("maps results to squares", () => {
    expect(resultEmojis([true, false])).toBe("🟩🟥");
  });
});
