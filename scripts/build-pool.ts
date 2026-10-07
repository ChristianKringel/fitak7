// Builds data/generated/pools/{category}.json from data/catalog.json.
//
// Usage: pnpm pool:build [--sample=<category>]
//   --sample prints ~20 songs of that category with their grouped versions.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createDeezerClient, type DeezerClient } from "@/lib/deezer/client";
import type { CatalogArtist } from "@/lib/game/catalog";
import {
  buildArtistSongs,
  type ArtistSongsResult,
  type CategoryPool,
  type DiscardReason,
  type SongGroup,
  type TrackCandidate,
} from "@/lib/game/pool";

import { POOLS_DIR, readCatalog } from "./lib/catalog-file";

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
    console.log(`\n• ${song.title} — ${song.artist}  [${song.id}]`);
    for (const v of versions) {
      const mark = v.trackId === song.trackId ? "★" : " ";
      console.log(
        `   ${mark} ${v.trackId}  "${v.title}"  ←  ${v.album.title} (${v.album.recordType}, ${v.album.releaseDate})`,
      );
    }
  }
}

async function main() {
  const sampleArg = process.argv.find((a) => a.startsWith("--sample="));
  const sampleCategory = sampleArg?.slice("--sample=".length);

  const catalog = await readCatalog();
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

  await mkdir(POOLS_DIR, { recursive: true });
  console.log("\nSummary:");
  for (const category of catalog.categories) {
    const artists = catalog.artists.filter(
      (a) => a.categories.includes(category.slug) && results.has(a.name),
    );
    const groups = artists
      .flatMap((a) => results.get(a.name)?.groups ?? [])
      .sort((a, b) => a.song.id.localeCompare(b.song.id));
    const pool: CategoryPool = {
      category: category.slug,
      songs: groups.map((g) => g.song),
    };
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
    const discardText = Object.entries(discarded)
      .filter(([, n]) => n > 0)
      .map(([reason, n]) => `${reason} ${n}`)
      .join(", ");
    console.log(
      `  ${category.slug}: ${artists.length} artists, ${pool.songs.length} songs (${grouped} with grouped versions)` +
        (discardText ? `; discarded: ${discardText}` : ""),
    );
    if (pool.songs.length < RECOMMENDED_POOL_SIZE) {
      console.warn(
        `    ⚠ Few songs for the daily challenge: ${RECOMMENDED_POOL_SIZE} needed to avoid repeats within 90 days.`,
      );
    }

    if (category.slug === sampleCategory) printSample(category.slug, groups);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
