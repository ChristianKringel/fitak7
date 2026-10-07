import { describe, expect, it } from "vitest";

import { normalizeTitle } from "./normalize";
import { buildOptions, NotEnoughOptionsError, type OptionSong } from "./options";
import { seededRng } from "./rng";

const song = (artist: string, title: string): OptionSong => ({
  id: `${artist}--${title}`,
  artist,
  title,
});

const POOL: OptionSong[] = [
  song("Engenheiros", "Infinita Highway"),
  song("Engenheiros", "Pra Ser Sincero"),
  song("Engenheiros", "Refrão de Bolero"),
  song("Engenheiros", "Toda Forma de Poder"),
  song("Engenheiros", "Terra de Gigantes"),
  song("Nenhum de Nós", "Camila, Camila"),
  song("Nenhum de Nós", "Astronauta de Mármore"),
  song("Replicantes", "Surfista Calhorda"),
  song("Replicantes", "Festa Punk"),
  song("TNT", "Ana Banana"),
];

function seeds(count: number) {
  return Array.from({ length: count }, (_, i) => seededRng(`seed-${i}`));
}

describe("buildOptions", () => {
  it("has the answer, 2 songs by the same artist and 1 by another", () => {
    const answer = POOL[0];
    for (const rng of seeds(50)) {
      const { songs, answerIndex } = buildOptions(answer, POOL, rng);
      expect(songs).toHaveLength(4);
      expect(songs[answerIndex]).toBe(answer);
      const distractors = songs.filter((s) => s !== answer);
      expect(distractors.filter((s) => s.artist === answer.artist)).toHaveLength(2);
      expect(distractors.filter((s) => s.artist !== answer.artist)).toHaveLength(1);
    }
  });

  it("places the answer in every position across seeds", () => {
    const positions = new Set(
      seeds(100).map((rng) => buildOptions(POOL[0], POOL, rng).answerIndex),
    );
    expect(positions).toEqual(new Set([0, 1, 2, 3]));
  });

  it("is deterministic for the same seed", () => {
    const a = buildOptions(POOL[0], POOL, seededRng("x"));
    const b = buildOptions(POOL[0], POOL, seededRng("x"));
    expect(a).toEqual(b);
  });

  it("completes with other artists when the artist has too few songs", () => {
    const answer = POOL.find((s) => s.artist === "TNT")!;
    for (const rng of seeds(20)) {
      const { songs } = buildOptions(answer, POOL, rng);
      const others = songs.filter((s) => s !== answer);
      expect(others).toHaveLength(3);
      expect(others.every((s) => s.artist !== "TNT")).toBe(true);
    }
  });

  it("uses one song of the artist plus two others when the artist has 2 songs", () => {
    const answer = POOL.find((s) => s.title === "Surfista Calhorda")!;
    const { songs } = buildOptions(answer, POOL, seededRng("y"));
    const others = songs.filter((s) => s !== answer);
    expect(others.filter((s) => s.artist === "Replicantes")).toHaveLength(1);
    expect(others.filter((s) => s.artist !== "Replicantes")).toHaveLength(2);
  });

  it("completes with the same artist when the category has one artist", () => {
    const solo = POOL.filter((s) => s.artist === "Engenheiros");
    const { songs } = buildOptions(solo[0], solo, seededRng("z"));
    expect(songs).toHaveLength(4);
    expect(new Set(songs.map((s) => s.id)).size).toBe(4);
  });

  it("never offers another version of the answer or repeated titles", () => {
    const pool = [
      song("Paralamas", "Diversão"),
      song("Titãs", "Diversão"),
      song("Titãs", "DIVERSÃO (Ao Vivo)"),
      song("Titãs", "Sonífera Ilha"),
      song("Titãs", "Epitáfio"),
      song("Titãs", "Marvin"),
      song("Legião", "Tempo Perdido"),
      song("Legião", "Diversao"),
    ];
    for (const rng of seeds(50)) {
      const answer = pool[1];
      const { songs } = buildOptions(answer, pool, rng);
      const keys = songs.map((s) => normalizeTitle(s.title));
      expect(new Set(keys).size).toBe(4);
      expect(keys.filter((k) => k === "diversao")).toHaveLength(1);
    }
  });

  it("throws when there are not enough distinct titles", () => {
    const pool = [
      song("A", "Um"),
      song("A", "Dois"),
      song("B", "Um (Ao Vivo)"),
      song("B", "Dois"),
    ];
    expect(() => buildOptions(pool[0], pool, seededRng("w"))).toThrow(
      NotEnoughOptionsError,
    );
  });
});
