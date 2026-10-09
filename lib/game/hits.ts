// Hits lists for categories limited to a range of release years (decades):
// only each artist's biggest songs of that period make it into the pool, so
// both answers and wrong options are well-known songs.

import {
  HITS_CANDIDATES_PER_ARTIST,
  HITS_DEFAULT_PER_ARTIST,
  HITS_MIN_RANK,
} from "./config";
import { areConfusableTitles, normalizeTitle } from "./normalize";
import type { PoolSong } from "./pool";

export interface HitsRules {
  /** Release years [from, to], inclusive. */
  years: readonly [number, number];
  /** Only the artist's this many most popular songs are candidates. */
  candidatesPerArtist: number;
  minRank: number;
  /** Max songs of the artist in the list (more if `include` has more). */
  limit: number;
  /** Titles that enter whatever their rank and year (curated classics). */
  include: readonly string[];
}

export const DEFAULT_HITS_RULES: Omit<HitsRules, "years"> = {
  candidatesPerArtist: HITS_CANDIDATES_PER_ARTIST,
  minRank: HITS_MIN_RANK,
  limit: HITS_DEFAULT_PER_ARTIST,
  include: [],
};

export interface ArtistHits {
  /** Selected songs, `year` set when known, renumbered: topPosition 1..n. */
  hits: PoolSong[];
  /** Candidates left out because their release year is unknown. */
  unknownYear: PoolSong[];
  /** `include` titles that match none of the artist's songs. */
  missingIncludes: string[];
}

/**
 * The artist's songs that may enter a hits list by rank, most popular
 * first: the ones `selectArtistHits` needs a release year for.
 */
export function hitCandidates(
  songs: readonly PoolSong[],
  rules: Pick<HitsRules, "candidatesPerArtist" | "minRank"> = DEFAULT_HITS_RULES,
): PoolSong[] {
  return songs
    .filter((s) => s.topPosition <= rules.candidatesPerArtist && s.rank >= rules.minRank)
    .sort((a, b) => a.topPosition - b.topPosition);
}

/**
 * Picks one artist's hits for a category: the `include` titles, then the
 * artist's most popular candidates released in the category's years, up to
 * `limit`. A song whose title looks like a more popular one's is taken as a
 * version of it that pool grouping missed (a re-recording with a subtitle,
 * say) and skipped, whatever its year.
 */
export function selectArtistHits(
  songs: readonly PoolSong[],
  yearOf: (song: PoolSong) => number | null,
  rules: HitsRules,
): ArtistHits {
  const [from, to] = rules.years;
  const chosen: PoolSong[] = [];
  const missingIncludes: string[] = [];
  for (const title of rules.include) {
    const key = normalizeTitle(title);
    const song = songs.find((s) => normalizeTitle(s.title) === key);
    if (!song) missingIncludes.push(title);
    else if (!chosen.includes(song)) chosen.push(song);
  }
  const limit = Math.max(rules.limit, chosen.length);

  const unknownYear: PoolSong[] = [];
  const seenTitles = chosen.map((s) => s.title);
  for (const song of hitCandidates(songs, rules)) {
    if (chosen.length >= limit) break;
    if (chosen.includes(song)) continue;
    const isVersion = seenTitles.some((t) => areConfusableTitles(t, song.title));
    seenTitles.push(song.title);
    if (isVersion) continue;
    const year = yearOf(song);
    if (year === null) {
      unknownYear.push(song);
      continue;
    }
    if (year >= from && year <= to) chosen.push(song);
  }

  const hits = chosen
    .sort((a, b) => a.topPosition - b.topPosition)
    .map((song, i): PoolSong => {
      const year = yearOf(song);
      return { ...song, ...(year === null ? {} : { year }), topPosition: i + 1 };
    });
  return { hits, unknownYear, missingIncludes };
}
