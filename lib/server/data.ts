import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { parseCatalog, type Catalog, type Category } from "@/lib/game/catalog";
import type { Genre } from "@/lib/game/genres";
import type { HardcoreSchedule } from "@/lib/game/hardcore";
import type { CategoryPool } from "@/lib/game/pool";
import type { CategorySchedule } from "@/lib/game/schedule";

// Data files ship with the deployment (see outputFileTracingIncludes in
// next.config.ts) and are read once per server instance in production.
const DATA_DIR = path.join(process.cwd(), "data");
const memoize = process.env.NODE_ENV === "production";
const memo = new Map<string, Promise<unknown>>();

function load<T>(file: string, parse: (raw: unknown) => T): Promise<T | null> {
  const cached = memo.get(file);
  if (cached) return cached as Promise<T | null>;
  const result = readFile(path.join(DATA_DIR, file), "utf8").then(
    (text) => parse(JSON.parse(text)),
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return null;
      throw error;
    },
  );
  if (memoize) memo.set(file, result);
  return result;
}

function getCatalog(): Promise<Catalog | null> {
  return load("catalog.json", parseCatalog);
}

/** The category with this slug, or null. Callers must check before using a slug in a path. */
export async function getCategory(slug: string): Promise<Category | null> {
  const catalog = await getCatalog();
  return catalog?.categories.find((c) => c.slug === slug) ?? null;
}

/**
 * Genre of each artist for the hardcore mode: only in hits lists; in niche
 * categories any artist of the category sounds alike (null).
 */
export async function getGenreLookup(category: Category): Promise<(artist: string) => Genre | null> {
  const catalog = await getCatalog();
  if (!category.years) return () => null;
  const genres = new Map(catalog?.artists.map((a) => [a.name, a.genre ?? null]));
  return (artist) => genres.get(artist) ?? null;
}

export async function getPool(category: Category): Promise<CategoryPool | null> {
  return load(`generated/pools/${category.slug}.json`, (raw) => raw as CategoryPool);
}

export async function getSchedule(category: Category): Promise<CategorySchedule | null> {
  return load(`generated/schedules/${category.slug}.json`, (raw) => raw as CategorySchedule);
}

export async function getHardcoreSchedule(category: Category): Promise<HardcoreSchedule | null> {
  return load(`generated/schedules/hardcore/${category.slug}.json`, (raw) => raw as HardcoreSchedule);
}

export interface CategorySummary extends Category {
  songCount: number;
}

/** Catalog categories with the size of their pools, in catalog order. */
export async function listCategories(): Promise<CategorySummary[]> {
  const catalog = await getCatalog();
  if (!catalog) return [];
  return Promise.all(
    catalog.categories.map(async (category) => ({
      ...category,
      songCount: (await getPool(category))?.songs.length ?? 0,
    })),
  );
}
