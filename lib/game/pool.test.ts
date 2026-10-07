import { describe, expect, it } from "vitest";

import { buildArtistSongs, songId, type TrackCandidate } from "./pool";

const ARTIST = { name: "Engenheiros do Hawaii", deezerId: 1, excludeTrackIds: [] };

let nextId = 100;
function track(
  title: string,
  album: Partial<TrackCandidate["album"]> = {},
  overrides: Partial<TrackCandidate> = {},
): TrackCandidate {
  return {
    trackId: nextId++,
    title,
    duration: 200,
    hasPreview: true,
    readable: true,
    trackArtistId: 1,
    album: {
      id: 1,
      title: "Longe Demais das Capitais",
      releaseDate: "1986-01-01",
      recordType: "album",
      ...album,
    },
    ...overrides,
  };
}

describe("buildArtistSongs", () => {
  it("groups versions and prefers the oldest unmarked studio album version", () => {
    const live = track("Infinita Highway (Ao Vivo)", { title: "Alívio Imediato", releaseDate: "1989-01-01" });
    const acoustic = track("Infinita Highway", { title: "Acústico MTV", releaseDate: "2004-01-01" });
    const compilation = track("Infinita Highway", { title: "Mega Hits", releaseDate: "1980-01-01", recordType: "compile" });
    const studio = track("Infinita Highway", { title: "A Revolta dos Dândis", releaseDate: "1987-01-01" });
    const remaster = track("Infinita Highway - Remasterizado", { title: "A Revolta dos Dândis (Remasterizado)", releaseDate: "2015-01-01" });

    const { groups } = buildArtistSongs(ARTIST, [live, acoustic, compilation, remaster, studio]);

    expect(groups).toHaveLength(1);
    const { song } = groups[0];
    expect(song.trackId).toBe(studio.trackId);
    expect(song.title).toBe("Infinita Highway");
    expect(song.id).toBe("engenheiros-do-hawaii--infinita-highway");
    expect(song.altTrackIds).toEqual(
      [live, acoustic, compilation, remaster].map((t) => t.trackId).sort((a, b) => a - b),
    );
  });

  it("uses a clean display title when only a live version exists", () => {
    const { groups } = buildArtistSongs(ARTIST, [
      track("Até o Fim (Ao Vivo)", { title: "Ao Vivo" }),
    ]);
    expect(groups[0].song.title).toBe("Até o Fim");
  });

  it("discards unusable tracks", () => {
    const { groups, discarded } = buildArtistSongs(ARTIST, [
      track("Sem Preview", {}, { hasPreview: false }),
      track("Vinheta", {}, { duration: 30 }),
      track("Medley: A / B"),
      track("De Outro Artista", {}, { trackArtistId: 2 }),
      track("Indisponível", {}, { readable: false }),
      track("Toda Forma de Poder"),
    ]);
    expect(groups.map((g) => g.song.title)).toEqual(["Toda Forma de Poder"]);
    expect(discarded).toMatchObject({
      "no-preview": 1,
      "too-short": 1,
      medley: 1,
      "other-artist": 1,
      unreadable: 1,
    });
  });

  it("excludes the whole song when any version is excluded", () => {
    const studio = track("Pra Ser Sincero");
    const live = track("Pra Ser Sincero (Ao Vivo)");
    const { groups, discarded } = buildArtistSongs(
      { ...ARTIST, excludeTrackIds: [live.trackId] },
      [studio, live, track("Refrão de Bolero")],
    );
    expect(groups.map((g) => g.song.title)).toEqual(["Refrão de Bolero"]);
    expect(discarded.excluded).toBe(2);
  });

  it("ignores duplicate track ids", () => {
    const t = track("Ninguém = Ninguém");
    const { groups } = buildArtistSongs(ARTIST, [t, { ...t }]);
    expect(groups[0].song.altTrackIds).toEqual([]);
  });
});

describe("songId", () => {
  it("is the same for every version of a song", () => {
    expect(songId("Titãs", "Epitáfio (Acústico)")).toBe(songId("Titãs", "Epitáfio"));
    expect(songId("Titãs", "Epitáfio")).toBe("titas--epitafio");
  });
});
