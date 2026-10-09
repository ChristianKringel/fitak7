// Builds data/generated/pools/{category}.json from data/catalog.json.
//
// Usage: pnpm pool:build [--only=<category,...>] [--sample=<category>] [--retry-missing-years]
//   --only rebuilds just these categories' pools, fetching only their artists.
//   --sample prints ~20 songs of these categories (comma-separated) with
//     their grouped versions; for hits lists, every song with its year and
//     rank, and how many songs of the period each artist has.
//   --retry-missing-years looks up again on MusicBrainz the songs it didn't
//     find before.
//
// Categories with `years` are hits lists (see lib/game/hits.ts); their
// songs' release years come from the catalog or MusicBrainz.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createDeezerClient, type DeezerClient } from "@/lib/deezer/client";
import type { CatalogArtist, Category } from "@/lib/game/catalog";
import { DEFAULT_HITS_RULES, selectArtistHits } from "@/lib/game/hits";
import {
  buildArtistSongs,
  type ArtistSongsResult,
  type CategoryPool,
  type DiscardReason,
  type PoolSong,
  type SongGroup,
  type TrackCandidate,
} from "@/lib/game/pool";
import { answerCandidates } from "@/lib/game/popularity";
import { createMusicBrainzClient } from "@/lib/musicbrainz/client";

import { POOLS_DIR, readCatalog } from "./lib/catalog-file";
import {
  readSongYears,
  resolveSongYears,
  songYearLookup,
  type SongYearCache,
} from "./lib/song-years";

/** 5 songs a day without repeats inside a 90-day window. */
const RECOMMENDED_POOL_SIZE = 5 * 90;
const SAMPLE_SIZE = 20;

async function fetchArtistTracks(
  deezer: DeezerClient,
  artist: CatalogArtist & { deezerId: number },
): Promise<TrackCandidate[]> {
  const excludedAlbums = new Set(artist.excludeAlbumIds);
  const albums = (await deezer.getArtistAlbums(artist.deezerId)).filter(
    (album) => !excludedAlbums.has(album.id),
  );
  // Requests are throttled by the client; running them concurrently just
  // keeps the queue full.
  const perAlbum = await Promise.all(
    albums.map(async (album) => {
      const tracks = await deezer.getAlbumTracks(album.id);
      return tracks.map(
        (t): TrackCandidate => ({
          trackId: t.id,
          title: t.title,
          duration: t.duration,
          hasPreview: Boolean(t.preview),
          readable: t.readable,
          rank: t.rank,
          trackArtistId: t.artist.id,
          album: {
            id: album.id,
            title: album.title,
            releaseDate: album.release_date,
            recordType: album.record_type,
          },
        }),
      );
    }),
  );
  return perAlbum.flat();
}

function evenlySpaced<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  const step = items.length / count;
  return Array.from({ length: count }, (_, i) => items[Math.floor(i * step)]);
}

function printSample(category: string, groups: SongGroup[]) {
  const grouped = groups.filter((g) => g.versions.length > 1);
  const single = groups.filter((g) => g.versions.length === 1);
  const half = SAMPLE_SIZE / 2;
  const sample = [
    ...evenlySpaced(grouped, half),
    ...evenlySpaced(single, SAMPLE_SIZE - Math.min(half, grouped.length)),
  ];
  console.log(`\nSample from ${category} (${sample.length} songs):`);
  for (const { song, versions } of sample) {
    console.log(`\n• ${song.title} — ${song.artist}  [${song.id}]  #${song.topPosition} (rank ${song.rank})`);
    for (const v of versions) {
      const mark = v.trackId === song.trackId ? "★" : " ";
      console.log(
        `   ${mark} ${v.trackId}  "${v.title}"  ←  ${v.album.title} (${v.album.recordType}, ${v.album.releaseDate})`,
      );
    }
  }
}

/**
 * Pool of a hits list: each artist's biggest songs released in the
 * category's years, as many as the artist's `hits` limit. Prints the
 * candidates left out for lack of a year, so they can get one in the
 * catalog's `songYears`, and `include` titles that match no song.
 */
function buildHitsPool(
  category: Category,
  years: readonly [number, number],
  artists: CatalogArtist[],
  results: Map<string, ArtistSongsResult>,
  yearCache: SongYearCache,
  printHits: boolean,
): CategoryPool {
  const songs: PoolSong[] = [];
  const unknown: string[] = [];
  const withoutHits: string[] = [];
  const missing: string[] = [];
  const periodCounts: string[] = [];
  for (const artist of artists) {
    const lookup = songYearLookup(artist, yearCache);
    const yearOf = (song: PoolSong) => lookup(song)?.year ?? null;
    const artistSongs = results.get(artist.name)?.groups.map((g) => g.song) ?? [];
    const curation = artist.hits?.[category.slug];
    const rules = {
      ...DEFAULT_HITS_RULES,
      years,
      limit: curation?.limit ?? DEFAULT_HITS_RULES.limit,
      include: curation?.include ?? [],
    };
    const { hits, unknownYear, missingIncludes } = selectArtistHits(artistSongs, yearOf, rules);
    if (printHits) {
      const all = selectArtistHits(artistSongs, yearOf, { ...rules, limit: rules.candidatesPerArtist });
      periodCounts.push(`${String(all.hits.length).padStart(3)}  (limit ${rules.limit})  ${artist.name}`);
    }
    songs.push(...hits);
    if (hits.length === 0) withoutHits.push(artist.name);
    for (const title of missingIncludes) missing.push(`${artist.name} — ${title}`);
    for (const song of unknownYear) {
      unknown.push(`${song.artist} — ${song.title} (Deezer: ${song.album.releaseDate.slice(0, 4)}, rank ${song.rank})`);
    }
  }
  songs.sort((a, b) => a.id.localeCompare(b.id));

  if (withoutHits.length > 0) {
    console.log(`    ${category.slug}: no hits in ${years.join("–")} for ${withoutHits.join(", ")}`);
  }
  if (missing.length > 0) {
    console.warn(`    ⚠ ${category.slug}: ${missing.length} \`include\` title(s) match no song of the artist:`);
    for (const line of missing) console.warn(`      ${line}`);
  }
  if (unknown.length > 0) {
    console.warn(`    ⚠ ${category.slug}: ${unknown.length} top song(s) left out without a release year (add them to songYears):`);
    for (const line of unknown) console.warn(`      ${line}`);
  }
  if (printHits) {
    console.log(`\nSongs of ${category.slug} per artist, before the limit:`);
    for (const line of periodCounts.sort((a, b) => b.localeCompare(a))) console.log(`  ${line}`);
    console.log(`\nHits of ${category.slug} (${songs.length} songs):`);
    for (const song of [...songs].sort((a, b) => b.rank - a.rank)) {
      console.log(`  ${song.year ?? "????"}  ${String(song.rank).padStart(6)}  ${song.artist} — ${song.title}`);
    }
  }
  return { category: category.slug, topShare: 1, songs };
}

async function main() {
  const sampleArg = process.argv.find((a) => a.startsWith("--sample="));
  const sampleCategories = new Set(sampleArg?.slice("--sample=".length).split(",") ?? []);

  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg ? new Set(onlyArg.slice("--only=".length).split(",")) : null;

  const fullCatalog = await readCatalog();
  for (const slug of only ?? []) {
    if (!fullCatalog.categories.some((c) => c.slug === slug)) throw new Error(`Unknown category: ${slug}`);
  }
  const catalog = only
    ? {
        categories: fullCatalog.categories.filter((c) => only.has(c.slug)),
        artists: fullCatalog.artists.filter((a) => a.categories.some((slug) => only.has(slug))),
      }
    : fullCatalog;
  const deezer = createDeezerClient();

  const unresolved = catalog.artists.filter((a) => a.deezerId === null);
  for (const artist of unresolved) {
    console.warn(`⚠ Skipping ${artist.name}: deezerId is null (run catalog:resolve).`);
  }

  // Fetch each artist once, even if it belongs to several categories.
  const results = new Map<string, ArtistSongsResult>();
  for (const artist of catalog.artists) {
    if (artist.deezerId === null) continue;
    const deezerId = artist.deezerId;
    const tracks = await fetchArtistTracks(deezer, { ...artist, deezerId });
    const result = buildArtistSongs(
      { name: artist.name, deezerId, excludeTrackIds: artist.excludeTrackIds },
      tracks,
    );
    results.set(artist.name, result);
    const versions = result.groups.reduce((n, g) => n + g.versions.length, 0);
    console.log(
      `  ${artist.name}: ${tracks.length} tracks → ${result.groups.length} songs (${versions} playable versions)`,
    );
  }

  // Release years, only needed for hits lists.
  const hitsCategories = new Set(
    catalog.categories.filter((c) => c.years).map((c) => c.slug),
  );
  const yearCache = await readSongYears();
  const hitsArtists = catalog.artists.filter(
    (a) => a.categories.some((slug) => hitsCategories.has(slug)) && results.has(a.name),
  );
  if (hitsArtists.length > 0) {
    console.log("\nRelease years:");
    await resolveSongYears(
      createMusicBrainzClient(),
      hitsArtists.map((artist) => ({
        artist,
        songs: results.get(artist.name)?.groups.map((g) => g.song) ?? [],
      })),
      yearCache,
      process.argv.includes("--retry-missing-years"),
    );
  }

  await mkdir(POOLS_DIR, { recursive: true });
  console.log("\nSummary:");
  for (const category of catalog.categories) {
    const artists = catalog.artists.filter(
      (a) => a.categories.includes(category.slug) && results.has(a.name),
    );
    const groups = artists
      .flatMap((a) => results.get(a.name)?.groups ?? [])
      .sort((a, b) => a.song.id.localeCompare(b.song.id));
    const pool: CategoryPool = category.years
      ? buildHitsPool(category, category.years, artists, results, yearCache, sampleCategories.has(category.slug))
      : { category: category.slug, songs: groups.map((g) => g.song) };
    await writeFile(
      path.join(POOLS_DIR, `${category.slug}.json`),
      JSON.stringify(pool, null, 2) + "\n",
    );

    const discarded: Partial<Record<DiscardReason, number>> = {};
    for (const a of artists) {
      for (const [reason, n] of Object.entries(results.get(a.name)?.discarded ?? {})) {
        const key = reason as DiscardReason;
        discarded[key] = (discarded[key] ?? 0) + n;
      }
    }
    const grouped = groups.filter((g) => g.versions.length > 1).length;
    const answerable = answerCandidates(pool.songs, pool.topShare).songs.length;
    const discardText = Object.entries(discarded)
      .filter(([, n]) => n > 0)
      .map(([reason, n]) => `${reason} ${n}`)
      .join(", ");
    console.log(
      `  ${category.slug}: ${artists.length} artists, ${pool.songs.length} songs (${answerable} can be answers, ${grouped} with grouped versions)` +
        (discardText ? `; discarded: ${discardText}` : ""),
    );
    if (answerable < RECOMMENDED_POOL_SIZE) {
      console.warn(
        `    ⚠ Few songs for the daily challenge: ${RECOMMENDED_POOL_SIZE} needed to avoid repeats within 90 days.`,
      );
    }

    if (sampleCategories.has(category.slug) && !category.years) printSample(category.slug, groups);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
