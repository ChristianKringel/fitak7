import { describe, expect, it } from "vitest";

import { matchArtist, type ArtistCandidate } from "./artist-match";

const c = (id: number, name: string, nb_fan: number): ArtistCandidate => ({
  id,
  name,
  nb_fan,
  link: `https://www.deezer.com/artist/${id}`,
});

describe("matchArtist", () => {
  it("resolves a single exact match, ignoring case and accents", () => {
    const result = matchArtist("Bidê ou Balde", [
      c(1, "BIDE OU BALDE", 5000),
      c(2, "Bidê ou Balde & Convidados", 90000),
    ]);
    expect(result).toMatchObject({ kind: "resolved", artist: { id: 1 } });
  });

  it("resolves the clearly most popular of several exact matches", () => {
    const result = matchArtist("TNT", [c(1, "TNT", 1000), c(2, "TNT", 100_000)]);
    expect(result).toMatchObject({ kind: "resolved", artist: { id: 2 } });
  });

  it("refuses to guess between similarly popular exact matches", () => {
    const result = matchArtist("TNT", [
      c(1, "TNT", 40_000),
      c(2, "TNT", 100_000),
      c(3, "TNT", 10),
      c(4, "TNT", 5),
    ]);
    expect(result.kind).toBe("ambiguous");
    if (result.kind === "ambiguous") {
      expect(result.candidates.map((x) => x.id)).toEqual([2, 1, 3]);
    }
  });

  it("treats punctuation as significant", () => {
    const result = matchArtist("Ira!", [c(1, "Ira", 900_000)]);
    expect(result.kind).toBe("ambiguous");
  });

  it("returns the top 3 by fans when nothing matches exactly", () => {
    const result = matchArtist("Os Mirins", [
      c(1, "Mirins", 10),
      c(2, "Os Mirins do Sul", 300),
      c(3, "Mirim", 20),
      c(4, "Mirinho", 5),
    ]);
    expect(result).toMatchObject({ kind: "ambiguous" });
    if (result.kind === "ambiguous") {
      expect(result.candidates.map((x) => x.id)).toEqual([2, 3, 1]);
    }
  });

  it("ignores empty profiles with the exact name", () => {
    const result = matchArtist("La Montanara", [
      { ...c(1, "La Montanara", 3), nb_album: 0 },
      c(2, "Orquestra La Montanara", 246),
    ]);
    expect(result.kind).toBe("ambiguous");
  });

  it("does not resolve when the top match has zero fans", () => {
    const result = matchArtist("X", [c(1, "X", 0), c(2, "X", 0)]);
    expect(result.kind).toBe("ambiguous");
  });
});
