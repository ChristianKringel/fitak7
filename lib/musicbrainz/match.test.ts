import { describe, expect, it } from "vitest";

import { earliestReleaseYear, recordingQuery, searchTitle } from "./match";
import type { MusicBrainzRecording } from "./types";

function recording(title: string, artist: string, date?: string): MusicBrainzRecording {
  return {
    id: `${title}-${artist}-${date ?? ""}`,
    title,
    "first-release-date": date,
    "artist-credit": [{ name: artist, artist: { id: "x", name: artist } }],
  };
}

describe("earliestReleaseYear", () => {
  it("takes the earliest release among the artist's recordings of the song", () => {
    const recordings = [
      recording("Tempo Perdido", "Legião Urbana", "2007-01-01"),
      recording("Tempo Perdido (ao vivo)", "Legião Urbana", "1992"),
      recording("Tempo Perdido", "Legião Urbana", "1986-07"),
    ];
    expect(earliestReleaseYear(recordings, "Tempo Perdido", "Legião Urbana")).toBe(1986);
  });

  it("ignores covers by other artists and other titles", () => {
    const recordings = [
      recording("Tempo Perdido", "Outro Artista", "1980"),
      recording("Tempo Perdido Demais", "Legião Urbana", "1981"),
      recording("Tempo Perdido", "Legião Urbana", "1986"),
    ];
    expect(earliestReleaseYear(recordings, "Tempo Perdido", "Legião Urbana")).toBe(1986);
  });

  it("matches artist names ignoring accents, case and leading articles", () => {
    const recordings = [recording("Óculos", "Paralamas do Sucesso", "1984")];
    expect(earliestReleaseYear(recordings, "Oculos", "Os Paralamas do Sucesso")).toBe(1984);
  });

  it("ignores spacing differences in titles", () => {
    const recordings = [recording("3x4", "Engenheiros do Hawaii", "1991")];
    expect(earliestReleaseYear(recordings, "3 X 4", "Engenheiros do Hawaii")).toBe(1991);
  });

  it("ignores bracketed translations in titles", () => {
    const recordings = [recording("O Amor e o Poder", "Rosana", "1987")];
    expect(earliestReleaseYear(recordings, "O Amor E O Poder (The Power Of Love)", "Rosana")).toBe(1987);
  });

  it("returns null when no recording matches or has a date", () => {
    expect(earliestReleaseYear([recording("Será", "Legião Urbana")], "Será", "Legião Urbana")).toBeNull();
    expect(earliestReleaseYear([], "Será", "Legião Urbana")).toBeNull();
  });
});

describe("recordingQuery", () => {
  it("quotes and escapes title and artist", () => {
    expect(recordingQuery('Say "Hi"', "AC\\DC")).toBe('recording:"Say \\"Hi\\"" AND artist:"AC\\\\DC"');
  });
});

describe("searchTitle", () => {
  it("drops bracketed segments", () => {
    expect(searchTitle("Superfantastico (Super Fantastico)")).toBe("Superfantastico");
    expect(searchTitle("Sou eu [Entre ela e eu]")).toBe("Sou eu");
    expect(searchTitle("(Untitled)")).toBe("(Untitled)");
  });
});
