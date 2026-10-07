// Builds data/generated/schedules/{category}.json from the pools.
// Keeps past days and today; (re)generates the following days.
//
// Usage: pnpm schedule:build [--days=60]

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { gameDate } from "@/lib/game/date";
import type { CategoryPool } from "@/lib/game/pool";
import {
  buildSchedule,
  DEFAULT_SCHEDULE_DAYS,
  type CategorySchedule,
} from "@/lib/game/schedule";

import {
  POOLS_DIR,
  readCatalog,
  readJsonIfExists,
  SCHEDULES_DIR,
} from "./lib/catalog-file";

async function main() {
  const daysArg = process.argv.find((a) => a.startsWith("--days="));
  const days = daysArg ? Number(daysArg.slice("--days=".length)) : DEFAULT_SCHEDULE_DAYS;
  if (!Number.isInteger(days) || days < 1) throw new Error(`Invalid --days: ${daysArg}`);

  const catalog = await readCatalog();
  const today = gameDate(new Date());
  console.log(`Today (America/Sao_Paulo): ${today}; window: ${days} days\n`);
  await mkdir(SCHEDULES_DIR, { recursive: true });

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
    });
    await writeFile(file, JSON.stringify(schedule, null, 2) + "\n");

    const dates = Object.keys(schedule.days);
    console.log(
      `${category.slug}: kept ${stats.keptDays} day(s), generated ${stats.generatedDays}; covers until ${dates.at(-1)}`,
    );
    if (stats.recentRepeats > 0) {
      console.warn(`  ⚠ ${stats.recentRepeats} round(s) reuse a song played in the last 90 days (pool too small).`);
    }
    if (stats.daysWithRepeatedArtist > 0) {
      console.warn(`  ⚠ ${stats.daysWithRepeatedArtist} day(s) repeat an artist.`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
