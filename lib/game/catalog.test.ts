import { describe, expect, it } from "vitest";

import { parseCatalog } from "./catalog";

function catalog(category: object = {}, artist: object = {}) {
  return {
    categories: [{ slug: "anos-80", name: "Anos 80", description: "", ...category }],
    artists: [
      {
        name: "Legião Urbana",
        deezerId: 1,
        categories: ["anos-80"],
        excludeAlbumIds: [],
        excludeTrackIds: [],
        notes: "",
        ...artist,
      },
    ],
  };
}

describe("parseCatalog", () => {
  it("accepts year ranges and song year overrides", () => {
    const parsed = parseCatalog(catalog({ years: [1980, 1989] }, { songYears: { "Tempo Perdido": 1986 } }));
    expect(parsed.categories[0].years).toEqual([1980, 1989]);
  });

  it("rejects invalid year ranges", () => {
    expect(() => parseCatalog(catalog({ years: [1989, 1980] }))).toThrow(/years/);
    expect(() => parseCatalog(catalog({ years: [1980] }))).toThrow(/years/);
    expect(() => parseCatalog(catalog({ years: ["1980", 1989] }))).toThrow(/years/);
  });

  it("rejects invalid song years", () => {
    expect(() => parseCatalog(catalog({}, { songYears: { "Tempo Perdido": "1986" } }))).toThrow(/songYears/);
    expect(() => parseCatalog(catalog({}, { songYears: [1986] }))).toThrow(/songYears/);
  });

  it("accepts hits curation for the artist's hits lists", () => {
    const parsed = parseCatalog(
      catalog({ years: [1980, 1989] }, { hits: { "anos-80": { limit: 7, include: ["Será"] } } }),
    );
    expect(parsed.artists[0].hits?.["anos-80"]).toEqual({ limit: 7, include: ["Será"] });
  });

  it("rejects hits curation for other categories or with bad values", () => {
    expect(() => parseCatalog(catalog({}, { hits: { "anos-80": { limit: 7 } } }))).toThrow(/hits/);
    expect(() => parseCatalog(catalog({ years: [1980, 1989] }, { hits: { "anos-90": { limit: 7 } } }))).toThrow(/hits/);
    expect(() => parseCatalog(catalog({ years: [1980, 1989] }, { hits: { "anos-80": { limit: 0 } } }))).toThrow(/hits/);
    expect(() => parseCatalog(catalog({ years: [1980, 1989] }, { hits: { "anos-80": { include: [""] } } }))).toThrow(/hits/);
  });
});
