import { describe, expect, it } from "vitest";

import { hitCandidates, selectArtistHits, type HitsRules } from "./hits";
import type { PoolSong } from "./pool";

function song(title: string, topPosition: number, rank = 500_000): PoolSong {
  return {
    id: `artist--${title}`,
    title,
    artist: "Legião Urbana",
    artistDeezerId: 1,
    trackId: topPosition,
    altTrackIds: [],
    album: { id: 1, title: "Dois", releaseDate: "2007-01-01", recordType: "album" },
    duration: 200,
    rank,
    topPosition,
  };
}

const RULES: HitsRules = { years: [1980, 1989], candidatesPerArtist: 20, minRank: 0, limit: 5, include: [] };

function yearsFrom(map: Record<string, number | null>) {
  return (s: PoolSong) => map[s.title] ?? null;
}

describe("selectArtistHits", () => {
  it("keeps the artist's most popular songs from the category's years, renumbered", () => {
    const songs = [song("Vento no Litoral", 3), song("Tempo Perdido", 1), song("Perfeição", 2), song("Será", 4)];
    const { hits, unknownYear } = selectArtistHits(
      songs,
      yearsFrom({ "Tempo Perdido": 1986, "Perfeição": 1993, "Vento no Litoral": 1991, "Será": 1985 }),
      RULES,
    );
    expect(hits.map((s) => [s.title, s.year, s.topPosition])).toEqual([
      ["Tempo Perdido", 1986, 1],
      ["Será", 1985, 2],
    ]);
    expect(unknownYear).toEqual([]);
  });

  it("includes both ends of the year range", () => {
    const songs = [song("A", 1), song("B", 2), song("C", 3)];
    const { hits } = selectArtistHits(songs, yearsFrom({ A: 1979, B: 1980, C: 1989 }), RULES);
    expect(hits.map((s) => s.title)).toEqual(["B", "C"]);
  });

  it("caps the songs per artist at its limit, keeping the most popular", () => {
    const songs = Array.from({ length: 10 }, (_, i) => song(`S${i + 1}`, i + 1));
    expect(selectArtistHits(songs, () => 1985, RULES).hits.map((s) => s.title)).toEqual(["S1", "S2", "S3", "S4", "S5"]);
    expect(selectArtistHits(songs, () => 1985, { ...RULES, limit: 7 }).hits).toHaveLength(7);
    expect(selectArtistHits(songs, () => 1985, { ...RULES, limit: 1 }).hits.map((s) => s.title)).toEqual(["S1"]);
  });

  it("always includes the curated titles, whatever their rank and year", () => {
    const songs = [song("Hit", 1), song("Outro", 2), song("Clássico", 30, 1000)];
    const { hits, missingIncludes } = selectArtistHits(
      songs,
      yearsFrom({ Hit: 1985, Outro: 1986 }),
      { ...RULES, limit: 2, include: ["clássico", "Não Existe"] },
    );
    expect(hits.map((s) => [s.title, s.year, s.topPosition])).toEqual([
      ["Hit", 1985, 1],
      ["Clássico", undefined, 2],
    ]);
    expect(missingIncludes).toEqual(["Não Existe"]);
  });

  it("keeps every curated title even beyond the limit", () => {
    const songs = [song("A", 1), song("B", 2), song("C", 3)];
    const { hits } = selectArtistHits(songs, () => 1985, { ...RULES, limit: 1, include: ["B", "C"] });
    expect(hits.map((s) => s.title)).toEqual(["B", "C"]);
  });

  it("only considers the artist's top songs, even if few are from the period", () => {
    const songs = Array.from({ length: 30 }, (_, i) => song(`S${i + 1}`, i + 1));
    // Only songs 19 to 30 are from the 80s; 21+ are outside the candidates.
    const { hits } = selectArtistHits(songs, (s) => (s.topPosition >= 19 ? 1985 : 1995), RULES);
    expect(hits.map((s) => s.title)).toEqual(["S19", "S20"]);
  });

  it("drops songs below the minimum rank", () => {
    const songs = [song("Hit", 1, 600_000), song("Obscura", 2, 100_000)];
    const { hits } = selectArtistHits(songs, () => 1985, { ...RULES, minRank: 200_000 });
    expect(hits.map((s) => s.title)).toEqual(["Hit"]);
  });

  it("skips versions of a more popular song that grouping missed", () => {
    const songs = [
      song("Era um Garoto", 1),
      song("Era Um Garoto (C'Era Un Ragazzo Che Come Me)", 2),
      song("Infinita Highway", 3),
    ];
    const years = yearsFrom({ "Era um Garoto": 1990, "Era Um Garoto (C'Era Un Ragazzo Che Come Me)": 1985, "Infinita Highway": 1987 });
    const { hits } = selectArtistHits(songs, years, RULES);
    expect(hits.map((s) => s.title)).toEqual(["Infinita Highway"]);
  });

  it("reports top songs without a year and leaves them out", () => {
    const songs = [song("Sem Ano", 1), song("Com Ano", 2)];
    const { hits, unknownYear } = selectArtistHits(songs, yearsFrom({ "Com Ano": 1985 }), RULES);
    expect(hits.map((s) => s.title)).toEqual(["Com Ano"]);
    expect(unknownYear.map((s) => s.title)).toEqual(["Sem Ano"]);
  });
});

describe("hitCandidates", () => {
  it("returns the top songs popular enough, most popular first", () => {
    const songs = [song("C", 3), song("A", 1), song("B", 2, 100), song("D", 4)];
    expect(hitCandidates(songs, { candidatesPerArtist: 3, minRank: 1000 }).map((s) => s.title)).toEqual(["A", "C"]);
  });
});
