import { foldName } from "./normalize";

export interface ArtistCandidate {
  id: number;
  name: string;
  nb_fan: number;
  /** Present in search results; 0 means an empty profile. */
  nb_album?: number;
  link: string;
}

/** The top exact match must have at least this many times the fans of the runner-up. */
export const POPULARITY_DOMINANCE_FACTOR = 5;

export type ArtistMatch =
  | { kind: "resolved"; artist: ArtistCandidate; reason: string }
  | { kind: "ambiguous"; candidates: ArtistCandidate[]; reason: string };

/**
 * Picks the Deezer artist for a catalog name, or refuses to guess.
 * Names match ignoring case, accents and extra spaces (punctuation counts).
 */
export function matchArtist(
  name: string,
  candidates: ArtistCandidate[],
): ArtistMatch {
  const target = foldName(name);
  const exact = candidates
    // Empty profiles (no albums) are never the artist we want.
    .filter((c) => foldName(c.name) === target && c.nb_album !== 0)
    .sort((a, b) => b.nb_fan - a.nb_fan);

  if (exact.length === 0) {
    const top = [...candidates].sort((a, b) => b.nb_fan - a.nb_fan).slice(0, 3);
    return { kind: "ambiguous", candidates: top, reason: "no exact name match" };
  }
  if (exact.length === 1) {
    return { kind: "resolved", artist: exact[0], reason: "only exact name match" };
  }
  const [first, second] = exact;
  if (first.nb_fan >= second.nb_fan * POPULARITY_DOMINANCE_FACTOR && first.nb_fan > 0) {
    return {
      kind: "resolved",
      artist: first,
      reason: `${exact.length} exact matches; top has ≥${POPULARITY_DOMINANCE_FACTOR}× the fans of the next`,
    };
  }
  return {
    kind: "ambiguous",
    candidates: exact.slice(0, 3),
    reason: `${exact.length} exact matches with similar popularity`,
  };
}
