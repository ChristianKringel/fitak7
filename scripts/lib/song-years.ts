// Release years of the songs that can enter hits lists (categories with
// `years`). Deezer's album dates are often a remaster's or reissue's, so the
// year comes from the catalog's `songYears` or else from MusicBrainz, cached
// in data/generated/song-years.json so each song is looked up only once.

import { writeFile } from "node:fs/promises";

import type { CatalogArtist } from "@/lib/game/catalog";
import { gameDate } from "@/lib/game/date";
import { hitCandidates } from "@/lib/game/hits";
import { normalizeTitle } from "@/lib/game/normalize";
import type { PoolSong } from "@/lib/game/pool";
import type { MusicBrainzClient } from "@/lib/musicbrainz/client";

import { readJsonIfExists, SONG_YEARS_PATH } from "./catalog-file";

interface CachedYear {
  /** null: MusicBrainz has no dated recording of the song by the artist. */
  year: number | null;
  checkedAt: string;
}

export type SongYearCache = Record<string, CachedYear>;

export async function readSongYears(): Promise<SongYearCache> {
  return (await readJsonIfExists<SongYearCache>(SONG_YEARS_PATH)) ?? {};
}

async function writeSongYears(cache: SongYearCache): Promise<void> {
  const sorted = Object.fromEntries(
    Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)),
  );
  await writeFile(SONG_YEARS_PATH, JSON.stringify(sorted, null, 2) + "\n");
}

export type YearSource = "catalog" | "musicbrainz";

/** Year of each song of the artist: catalog override, else cached lookup. */
export function songYearLookup(
  artist: CatalogArtist,
  cache: SongYearCache,
): (song: PoolSong) => { year: number; source: YearSource } | null {
  const overrides = new Map(
    Object.entries(artist.songYears ?? {}).map(([title, year]) => [normalizeTitle(title), year]),
  );
  return (song) => {
    const override = overrides.get(normalizeTitle(song.title));
    if (override !== undefined) return { year: override, source: "catalog" };
    const year = cache[song.id]?.year;
    return year == null ? null : { year, source: "musicbrainz" };
  };
}

/**
 * Looks up on MusicBrainz the songs of these artists that may enter a hits
 * list and have no year yet. Songs not found before are only retried with
 * `retryMissing`. Saves the cache after each artist.
 */
export async function resolveSongYears(
  musicbrainz: MusicBrainzClient,
  artists: { artist: CatalogArtist; songs: PoolSong[] }[],
  cache: SongYearCache,
  retryMissing: boolean,
): Promise<void> {
  const today = gameDate(new Date());
  for (const { artist, songs } of artists) {
    const yearOf = songYearLookup(artist, cache);
    const pending = hitCandidates(songs).filter((song) => {
      if (yearOf(song)) return false;
      const cached = cache[song.id];
      return !cached || (cached.year === null && retryMissing);
    });
    if (pending.length === 0) continue;
    let found = 0;
    for (const song of pending) {
      const year = await musicbrainz.findReleaseYear(song.title, artist.name);
      cache[song.id] = { year, checkedAt: today };
      if (year !== null) found++;
    }
    await writeSongYears(cache);
    console.log(`  ${artist.name}: ${found}/${pending.length} release years found on MusicBrainz`);
  }
}
