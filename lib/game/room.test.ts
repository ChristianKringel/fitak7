import { describe, expect, it } from "vitest";

import type { PoolSong } from "./pool";
import { seededRng } from "./rng";
import {
  buildRoomRounds,
  cleanNickname,
  formatDuration,
  generateRoomCode,
  isValidRoundCount,
  MAX_ROOM_ROUNDS,
  MIN_ROOM_ROUNDS,
  nicknameKey,
  parseRoomCode,
  rankPlayers,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  roundElapsedMs,
  type PlayerProgress,
} from "./room";

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

describe("room codes", () => {
  it("generates codes from the unambiguous alphabet", () => {
    const rng = seededRng("codes");
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode(rng);
      expect(code).toHaveLength(ROOM_CODE_LENGTH);
      expect([...code].every((c) => ROOM_CODE_ALPHABET.includes(c))).toBe(true);
    }
  });

  it("parses typed codes", () => {
    expect(parseRoomCode("4f9qkd")).toBe("4F9QKD");
    expect(parseRoomCode(" 4F9 QKD ")).toBe("4F9QKD");
    expect(parseRoomCode("4F9-QKD")).toBe("4F9QKD");
    expect(parseRoomCode("4F9QK")).toBeNull();
    expect(parseRoomCode("4F9QK0")).toBeNull(); // 0 is not in the alphabet
    expect(parseRoomCode("")).toBeNull();
  });
});

describe("settings", () => {
  it("accepts round counts within the limits", () => {
    expect(isValidRoundCount(MIN_ROOM_ROUNDS)).toBe(true);
    expect(isValidRoundCount(MAX_ROOM_ROUNDS)).toBe(true);
    expect(isValidRoundCount(MIN_ROOM_ROUNDS - 1)).toBe(false);
    expect(isValidRoundCount(MAX_ROOM_ROUNDS + 1)).toBe(false);
    expect(isValidRoundCount(7.5)).toBe(false);
    expect(isValidRoundCount("10")).toBe(false);
  });

  it("cleans nicknames", () => {
    expect(cleanNickname("  Tchê   Bagual ")).toBe("Tchê Bagual");
    expect(cleanNickname("   ")).toBeNull();
    expect(cleanNickname("x".repeat(21))).toBeNull();
    expect(cleanNickname(42)).toBeNull();
  });

  it("treats nicknames with different case or accents as the same", () => {
    expect(nicknameKey("João")).toBe(nicknameKey("joao"));
    expect(nicknameKey("Ana")).not.toBe(nicknameKey("Ana Paula"));
  });
});

describe("buildRoomRounds", () => {
  it("never repeats a song", () => {
    const rounds = buildRoomRounds(makePool(3, 80), MAX_ROOM_ROUNDS, seededRng("no-repeat"));
    expect(rounds).toHaveLength(MAX_ROOM_ROUNDS);
    expect(new Set(rounds.map((r) => r.songId)).size).toBe(MAX_ROOM_ROUNDS);
  });

  it("uses every artist before repeating one", () => {
    const rounds = buildRoomRounds(makePool(4, 40), 8, seededRng("artists"));
    const artists = rounds.map((r) => r.artist);
    expect(new Set(artists.slice(0, 4)).size).toBe(4);
    expect(new Set(artists.slice(4, 8)).size).toBe(4);
  });

  it("only picks each artist's top songs as answers", () => {
    // 40 songs per artist: the top 10% is 4 songs.
    const rounds = buildRoomRounds(makePool(3, 40), 10, seededRng("top"));
    for (const round of rounds) {
      const position = Number(round.songId.split("song-")[1]) + 1;
      expect(position).toBeLessThanOrEqual(4);
    }
  });

  it("puts the answer among the options", () => {
    for (const round of buildRoomRounds(makePool(5, 40), 10, seededRng("options"))) {
      expect(round.options).toHaveLength(4);
      expect(round.options[round.answerIndex]).toEqual({ title: round.title, artist: round.artist });
    }
  });

  it("is deterministic for the same seed", () => {
    const pool = makePool(5, 40);
    expect(buildRoomRounds(pool, 10, seededRng("same"))).toEqual(
      buildRoomRounds(pool, 10, seededRng("same")),
    );
  });

  it("fails when the pool can't fill the rounds", () => {
    // 3 artists × 3 top songs = 9 candidates.
    expect(() => buildRoomRounds(makePool(3, 10), 10, seededRng("small"))).toThrow();
  });
});

describe("roundElapsedMs", () => {
  it("counts from the first audio request", () => {
    expect(
      roundElapsedMs({ answeredAt: 15_000, audioStartedAt: 10_000, previousAnsweredAt: 2_000, joinedAt: 0 }),
    ).toBe(5_000);
  });

  it("falls back to the previous guess, then to the join time", () => {
    expect(
      roundElapsedMs({ answeredAt: 15_000, audioStartedAt: null, previousAnsweredAt: 2_000, joinedAt: 0 }),
    ).toBe(13_000);
    expect(
      roundElapsedMs({ answeredAt: 15_000, audioStartedAt: null, previousAnsweredAt: null, joinedAt: 1_000 }),
    ).toBe(14_000);
  });

  it("is never negative", () => {
    expect(
      roundElapsedMs({ answeredAt: 1_000, audioStartedAt: 2_000, previousAnsweredAt: null, joinedAt: 0 }),
    ).toBe(0);
  });
});

describe("rankPlayers", () => {
  const player = (name: string, joinedAt: number, answers: [boolean, number][]): PlayerProgress => ({
    id: name,
    name,
    joinedAt,
    answers: answers.map(([correct, elapsedMs]) => ({ correct, elapsedMs })),
  });

  it("ranks by correct answers, then by total time", () => {
    const ranked = rankPlayers(
      [
        player("Lento", 0, [[true, 9_000], [true, 9_000], [false, 1_000]]),
        player("Rápido", 1, [[true, 2_000], [true, 2_000], [false, 1_000]]),
        player("Craque", 2, [[true, 9_000], [true, 9_000], [true, 9_000]]),
      ],
      3,
    );
    expect(ranked.map((s) => [s.name, s.position])).toEqual([
      ["Craque", 1],
      ["Rápido", 2],
      ["Lento", 3],
    ]);
    expect(ranked[1]).toMatchObject({ correct: 2, totalMs: 5_000, answered: 3, finished: true });
  });

  it("shares the position on exact ties", () => {
    const ranked = rankPlayers(
      [player("A", 0, [[true, 1_000]]), player("B", 1, [[true, 1_000]]), player("C", 2, [[false, 1_000]])],
      1,
    );
    expect(ranked.map((s) => s.position)).toEqual([1, 1, 3]);
  });

  it("lists players still playing after the finished ones, without a position", () => {
    const ranked = rankPlayers(
      [
        player("Começando", 0, [[true, 1_000]]),
        player("Terminou", 1, [[false, 1_000], [false, 1_000]]),
        player("Quase", 2, [[false, 1_000]]),
        player("Entrou", 3, []),
      ],
      2,
    );
    expect(ranked.map((s) => s.name)).toEqual(["Terminou", "Começando", "Quase", "Entrou"]);
    expect(ranked.map((s) => s.position)).toEqual([1, null, null, null]);
  });
});

describe("formatDuration", () => {
  it("formats seconds and minutes", () => {
    expect(formatDuration(42_400)).toBe("42s");
    expect(formatDuration(185_000)).toBe("3min 05s");
  });
});
