// Cassette body colors, assigned to categories by their order in the catalog:
// the colors of the Rio Grande do Sul flag, then beige.

const TAPE_COLORS = ["#12a26a", "#e8452f", "#ffd21f", "#d9cba8"] as const;

export function tapeColor(index: number): string {
  return TAPE_COLORS[((index % TAPE_COLORS.length) + TAPE_COLORS.length) % TAPE_COLORS.length];
}

/** "01", "02"... as written on the cassette label. */
export function tapeNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}
