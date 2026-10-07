export interface Category {
  slug: string;
  name: string;
  description: string;
}

export interface CatalogArtist {
  name: string;
  /** null means "not resolved yet" (see `pnpm catalog:resolve`). */
  deezerId: number | null;
  categories: string[];
  excludeAlbumIds: number[];
  excludeTrackIds: number[];
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

/** Validates parsed catalog JSON and returns it typed. Throws on any problem. */
export function parseCatalog(raw: unknown): Catalog {
  if (typeof raw !== "object" || raw === null) fail("not an object");
  const { categories, artists } = raw as Record<string, unknown>;
  if (!Array.isArray(categories)) fail("`categories` must be an array");
  if (!Array.isArray(artists)) fail("`artists` must be an array");

  const slugs = new Set<string>();
  for (const [i, c] of categories.entries()) {
    const cat = c as Partial<Category>;
    if (typeof cat.slug !== "string" || !/^[a-z0-9-]+$/.test(cat.slug)) {
      fail(`categories[${i}].slug must be kebab-case`);
    }
    if (typeof cat.name !== "string") fail(`categories[${i}].name missing`);
    if (typeof cat.description !== "string") {
      fail(`categories[${i}].description missing`);
    }
    if (slugs.has(cat.slug)) fail(`duplicate category slug "${cat.slug}"`);
    slugs.add(cat.slug);
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
    if (typeof artist.notes !== "string") fail(`${where}.notes must be a string`);
  }

  return raw as Catalog;
}
