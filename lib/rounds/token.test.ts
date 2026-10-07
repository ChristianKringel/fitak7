import { randomBytes } from "node:crypto";

import { describe, expect, it } from "vitest";

import { openRound, parseRoundKey, ROUND_TOKEN_TTL_MS, sealRound, type RoundPayload } from "./token";

const KEY = randomBytes(32);
const NOW = 1_780_000_000_000;
const PAYLOAD: RoundPayload = {
  category: "rock-gaucho",
  songId: "engenheiros-do-hawaii--infinita-highway",
  trackId: 13310146,
  answerIndex: 2,
  issuedAt: NOW,
};

describe("round tokens", () => {
  it("round-trips the payload", () => {
    const token = sealRound(PAYLOAD, KEY);
    expect(openRound(token, KEY, { now: NOW })).toEqual(PAYLOAD);
  });

  it("does not leak the answer in readable form", () => {
    const token = sealRound(PAYLOAD, KEY);
    const decoded = Buffer.from(token, "base64url").toString("latin1");
    expect(decoded).not.toContain("infinita");
    expect(decoded).not.toContain("13310146");
    expect(token).not.toContain("infinita");
  });

  it("produces a different token each time", () => {
    expect(sealRound(PAYLOAD, KEY)).not.toBe(sealRound(PAYLOAD, KEY));
  });

  it("rejects tampered tokens", () => {
    const raw = Buffer.from(sealRound(PAYLOAD, KEY), "base64url");
    raw[20] ^= 1;
    expect(openRound(raw.toString("base64url"), KEY, { now: NOW })).toBeNull();
  });

  it("rejects tokens sealed with another key", () => {
    const token = sealRound(PAYLOAD, randomBytes(32));
    expect(openRound(token, KEY, { now: NOW })).toBeNull();
  });

  it("rejects garbage", () => {
    expect(openRound("", KEY, { now: NOW })).toBeNull();
    expect(openRound("not-a-token", KEY, { now: NOW })).toBeNull();
  });

  it("rejects expired tokens unless a longer max age is given", () => {
    const token = sealRound(PAYLOAD, KEY);
    const later = NOW + ROUND_TOKEN_TTL_MS + 1;
    expect(openRound(token, KEY, { now: later })).toBeNull();
    expect(openRound(token, KEY, { now: later, maxAgeMs: Infinity })).toEqual(PAYLOAD);
  });
});

describe("parseRoundKey", () => {
  it("requires a 32-byte base64 secret", () => {
    expect(() => parseRoundKey(undefined)).toThrow(/not set/);
    expect(() => parseRoundKey(Buffer.alloc(16).toString("base64"))).toThrow(/32 bytes/);
    expect(parseRoundKey(KEY.toString("base64"))).toEqual(KEY);
  });
});
