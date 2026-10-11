// Music genres of the artists in hits lists (decades), used by the hardcore
// mode to offer artists that sound alike. Niche categories don't need them:
// the category itself is the genre.

export const GENRES = [
  "rock",
  "pop",
  "mpb",
  "soul",
  "samba",
  "axe",
  "sertanejo",
  "forro",
  "romantica",
  "funk",
  "rap",
  "eletronica",
  "reggae",
  "infantil",
] as const;

export type Genre = (typeof GENRES)[number];

export const GENRE_NAMES: Record<Genre, string> = {
  rock: "Rock",
  pop: "Pop",
  mpb: "MPB",
  soul: "Soul e black music",
  samba: "Samba e pagode",
  axe: "Axé e música baiana",
  sertanejo: "Sertanejo",
  forro: "Forró e piseiro",
  romantica: "Romântica e brega",
  funk: "Funk",
  rap: "Rap e trap",
  eletronica: "Eletrônica",
  reggae: "Reggae",
  infantil: "Infantil",
};

/**
 * Genres close enough to fill the artist options when a genre has too few
 * artists in a category, closest first.
 */
export const NEIGHBOR_GENRES: Record<Genre, readonly Genre[]> = {
  rock: ["pop", "reggae"],
  pop: ["rock", "reggae"],
  mpb: ["soul", "samba", "romantica"],
  soul: ["mpb", "pop"],
  samba: ["axe", "soul"],
  axe: ["samba", "forro"],
  sertanejo: ["forro", "romantica"],
  forro: ["sertanejo", "axe"],
  romantica: ["sertanejo", "mpb"],
  funk: ["rap", "eletronica", "pop"],
  rap: ["funk", "soul"],
  eletronica: ["funk", "pop"],
  reggae: ["pop", "rock"],
  infantil: ["pop"],
};

export function isGenre(value: unknown): value is Genre {
  return typeof value === "string" && (GENRES as readonly string[]).includes(value);
}
