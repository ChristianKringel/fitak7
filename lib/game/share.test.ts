import { describe, expect, it } from "vitest";

import { hardcoreShareText, resultEmojis, roomInviteText, roomShareText, shareText } from "./share";

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

describe("roomShareText", () => {
  it("includes score, time, position and mode", () => {
    const text = roomShareText({
      categoryName: "Rock Gaúcho",
      results: [true, false, true, true, true],
      hardMode: true,
      totalMs: 72_000,
      position: { place: 1, of: 4 },
      url: "https://example.com/sala/4F9QKD",
    });
    expect(text).toBe(
      "Fita K7 · Desafio Rock Gaúcho\n4/5 · 1min 12s · 1º de 4 · modo difícil 🔥\n🟩🟥🟩🟩🟩\nhttps://example.com/sala/4F9QKD",
    );
  });

  it("works without position or url", () => {
    const text = roomShareText({
      categoryName: "Bandinhas",
      results: [false, true],
      hardMode: false,
      totalMs: 9_000,
      position: null,
    });
    expect(text).toBe("Fita K7 · Desafio Bandinhas\n1/2 · 9s\n🟥🟩");
  });
});

describe("roomShareText in hardcore rooms", () => {
  it("shows points and the hardcore squares", () => {
    const text = roomShareText({
      categoryName: "Anos 90",
      results: [true, false, false],
      hardcorePoints: [2, 1, 0],
      hardMode: true,
      totalMs: 42_000,
      position: null,
    });
    expect(text).toBe("Fita K7 · Desafio Anos 90\n3/6 · 42s · Hardcore 💀\n🟩🟨🟥");
  });
});

describe("roomInviteText", () => {
  it("mentions the category, the rounds and the link", () => {
    expect(roomInviteText("Rock BR", 10, "https://example.com/sala/ABC234")).toBe(
      "Te desafio no Fita K7! 10 músicas de Rock BR. Quem acerta mais?\nhttps://example.com/sala/ABC234",
    );
  });
});

describe("hardcoreShareText", () => {
  it("shows points out of 10 with a square per round", () => {
    const text = hardcoreShareText({
      categoryName: "Anos 80",
      date: "2026-10-11",
      points: [2, 1, 0, 2, 2],
      hardMode: true,
      url: "https://example.com/anos-80/hardcore",
    });
    expect(text).toBe(
      "Fita K7 · Hardcore 💀 · Anos 80\n11/10/2026 · 7/10 · modo difícil 🔥\n🟩🟨🟥🟩🟩\nhttps://example.com/anos-80/hardcore",
    );
  });
});
