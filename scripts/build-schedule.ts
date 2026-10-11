// Builds data/generated/schedules/{category}.json (daily challenge) and
// data/generated/schedules/hardcore/{category}.json (hardcore mode) from the
// pools. Keeps past days and today; (re)generates the following days.
//
// Usage: pnpm schedule:build [--days=60]

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { gameDate } from "@/lib/game/date";
import { buildHardcoreSchedule, type HardcoreSchedule } from "@/lib/game/hardcore";
import type { CategoryPool } from "@/lib/game/pool";
import {
  buildSchedule,
  DEFAULT_SCHEDULE_DAYS,
  type CategorySchedule,
  type ScheduleStats,
} from "@/lib/game/schedule";

import {
  HARDCORE_SCHEDULES_DIR,
  POOLS_DIR,
  readCatalog,
  readJsonIfExists,
  SCHEDULES_DIR,
} from "./lib/catalog-file";

function printStats(label: string, stats: ScheduleStats, lastDate: string | undefined) {
  console.log(
    `${label}: kept ${stats.keptDays} day(s), generated ${stats.generatedDays}; covers until ${lastDate}`,
  );
  if (stats.recentRepeats > 0) {
    console.warn(`  ⚠ ${stats.recentRepeats} round(s) reuse a song played in the last 90 days (pool too small).`);
  }
  if (stats.daysWithRepeatedArtist > 0) {
    console.warn(`  ⚠ ${stats.daysWithRepeatedArtist} day(s) repeat an artist.`);
  }
}

async function main() {
  const daysArg = process.argv.find((a) => a.startsWith("--days="));
  const days = daysArg ? Number(daysArg.slice("--days=".length)) : DEFAULT_SCHEDULE_DAYS;
  if (!Number.isInteger(days) || days < 1) throw new Error(`Invalid --days: ${daysArg}`);

  const catalog = await readCatalog();
  const today = gameDate(new Date());
  console.log(`Today (America/Sao_Paulo): ${today}; window: ${days} days\n`);
  await mkdir(HARDCORE_SCHEDULES_DIR, { recursive: true });
  const genres = new Map(catalog.artists.map((a) => [a.name, a.genre ?? null]));

  for (const category of catalog.categories) {
    const pool = await readJsonIfExists<CategoryPool>(
      path.join(POOLS_DIR, `${category.slug}.json`),
    );
    if (!pool || pool.songs.length < 10) {
      console.warn(
        `⚠ ${category.slug}: skipped (${pool ? `${pool.songs.length} songs` : "no pool; run pool:build"}).`,
      );
      continue;
    }

    const file = path.join(SCHEDULES_DIR, `${category.slug}.json`);
    const existing = await readJsonIfExists<CategorySchedule>(file);
    const { schedule, stats } = buildSchedule({
      category: category.slug,
      pool: pool.songs,
      existing,
      today,
      days,
      topShare: pool.topShare,
      uniqueArtists: category.years !== undefined,
    });
    await writeFile(file, JSON.stringify(schedule, null, 2) + "\n");
    printStats(category.slug, stats, Object.keys(schedule.days).at(-1));

    // Genres only matter in hits lists: in niche categories, every artist
    // of the category sounds alike.
    const isHits = category.years !== undefined;
    const withoutGenre = isHits
      ? [...new Set(pool.songs.map((s) => s.artist))].filter((name) => !genres.get(name))
      : [];
    if (withoutGenre.length > 0) {
      console.warn(`  ⚠ No genre in the catalog for ${withoutGenre.join(", ")}: hardcore offers any artist.`);
    }
    const hardcoreFile = path.join(HARDCORE_SCHEDULES_DIR, `${category.slug}.json`);
    const hardcore = buildHardcoreSchedule({
      category: category.slug,
      pool: pool.songs,
      decoys: pool.decoys,
      genreOf: (artist) => (isHits ? (genres.get(artist) ?? null) : null),
      existing: await readJsonIfExists<HardcoreSchedule>(hardcoreFile),
      daily: schedule,
      today,
      days,
      topShare: pool.topShare,
      uniqueArtists: isHits,
    });
    await writeFile(hardcoreFile, JSON.stringify(hardcore.schedule, null, 2) + "\n");
    printStats(`${category.slug} (hardcore)`, hardcore.stats, Object.keys(hardcore.schedule.days).at(-1));
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
