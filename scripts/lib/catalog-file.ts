import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { parseCatalog, type Catalog } from "@/lib/game/catalog";

export const ROOT_DIR = path.resolve(import.meta.dirname, "../..");
export const CATALOG_PATH = path.join(ROOT_DIR, "data/catalog.json");
export const POOLS_DIR = path.join(ROOT_DIR, "data/generated/pools");
export const SCHEDULES_DIR = path.join(ROOT_DIR, "data/generated/schedules");
export const SONG_YEARS_PATH = path.join(ROOT_DIR, "data/generated/song-years.json");

export async function readCatalog(): Promise<Catalog> {
  return parseCatalog(JSON.parse(await readFile(CATALOG_PATH, "utf8")));
}

export async function writeCatalog(catalog: Catalog): Promise<void> {
  await writeFile(CATALOG_PATH, JSON.stringify(catalog, null, 2) + "\n");
}

/** Parses a JSON file, or returns null when it does not exist. */
export async function readJsonIfExists<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
