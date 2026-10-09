export interface Category {
  slug: string;
  name: string;
  description: string;
  /**
   * Release years [from, to], inclusive. When set, the category is a hits
   * list: only each artist's biggest songs released in these years (see
   * `selectArtistHits`).
   */
  years?: [number, number];
}

/** Curation of an artist in one hits list (category with `years`). */
export interface ArtistHitsConfig {
  /** Max songs (default HITS_DEFAULT_PER_ARTIST): 7 for icons, 1 for one-hit wonders. */
  limit?: number;
  /** Song titles that always enter, whatever their rank and year. */
  include?: string[];
}

export interface CatalogArtist {
  name: string;
  /** null means "not resolved yet" (see `pnpm catalog:resolve`). */
  deezerId: number | null;
  categories: string[];
  excludeAlbumIds: number[];
  excludeTrackIds: number[];
  /**
   * Original release year by song title, overriding MusicBrainz. Only
   * needed for songs in categories with `years`.
   */
  songYears?: Record<string, number>;
  /** Per hits-list category slug. */
  hits?: Record<string, ArtistHitsConfig>;
  notes: string;
}

export interface Catalog {
  categories: Category[];
  artists: CatalogArtist[];
}

function fail(message: string): never {
  throw new Error(`Invalid catalog: ${message}`);
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((v) => Number.isInteger(v));
}

function isYear(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 1900 && (value as number) <= 2100;
}

function isYearRange(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    isYear(value[0]) &&
    isYear(value[1]) &&
    value[0] <= value[1]
  );
}

function isYearMap(value: unknown): value is Record<string, number> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(isYear)
  );
}

function isHitsConfig(value: unknown): value is ArtistHitsConfig {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const { limit, include } = value as Record<string, unknown>;
  return (
    (limit === undefined || (Number.isInteger(limit) && (limit as number) > 0)) &&
    (include === undefined ||
      (Array.isArray(include) && include.every((t) => typeof t === "string" && t.trim() !== "")))
  );
}

/** Validates parsed catalog JSON and returns it typed. Throws on any problem. */
export function parseCatalog(raw: unknown): Catalog {
  if (typeof raw !== "object" || raw === null) fail("not an object");
  const { categories, artists } = raw as Record<string, unknown>;
  if (!Array.isArray(categories)) fail("`categories` must be an array");
  if (!Array.isArray(artists)) fail("`artists` must be an array");

  const slugs = new Set<string>();
  const hitsSlugs = new Set<string>();
  for (const [i, c] of categories.entries()) {
    const cat = c as Partial<Category>;
    if (typeof cat.slug !== "string" || !/^[a-z0-9-]+$/.test(cat.slug)) {
      fail(`categories[${i}].slug must be kebab-case`);
    }
    if (typeof cat.name !== "string") fail(`categories[${i}].name missing`);
    if (typeof cat.description !== "string") {
      fail(`categories[${i}].description missing`);
    }
    if (cat.years !== undefined && !isYearRange(cat.years)) {
      fail(`categories[${i}].years must be [from, to] with from <= to`);
    }
    if (slugs.has(cat.slug)) fail(`duplicate category slug "${cat.slug}"`);
    slugs.add(cat.slug);
    if (cat.years) hitsSlugs.add(cat.slug);
  }

  const names = new Set<string>();
  for (const [i, a] of artists.entries()) {
    const artist = a as Partial<CatalogArtist>;
    const where = `artists[${i}] (${String(artist.name)})`;
    if (typeof artist.name !== "string" || !artist.name.trim()) {
      fail(`${where}.name missing`);
    }
    if (names.has(artist.name)) fail(`duplicate artist "${artist.name}"`);
    names.add(artist.name);
    if (artist.deezerId !== null && !Number.isInteger(artist.deezerId)) {
      fail(`${where}.deezerId must be an integer or null`);
    }
    if (
      !Array.isArray(artist.categories) ||
      artist.categories.length === 0 ||
      !artist.categories.every((s) => slugs.has(s))
    ) {
      fail(`${where}.categories must list known category slugs`);
    }
    if (!isNumberArray(artist.excludeAlbumIds)) {
      fail(`${where}.excludeAlbumIds must be an array of integers`);
    }
    if (!isNumberArray(artist.excludeTrackIds)) {
      fail(`${where}.excludeTrackIds must be an array of integers`);
    }
    if (artist.songYears !== undefined && !isYearMap(artist.songYears)) {
      fail(`${where}.songYears must map song titles to years`);
    }
    for (const [slug, config] of Object.entries(artist.hits ?? {})) {
      if (!hitsSlugs.has(slug) || !artist.categories?.includes(slug)) {
        fail(`${where}.hits.${slug}: not one of the artist's categories with years`);
      }
      if (!isHitsConfig(config)) {
        fail(`${where}.hits.${slug} must be { limit?: positive integer, include?: string[] }`);
      }
    }
    if (typeof artist.notes !== "string") fail(`${where}.notes must be a string`);
  }

  return raw as Catalog;
}
