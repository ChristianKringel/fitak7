// Picks a song's original release year out of MusicBrainz recording search
// results: the earliest first release among recordings with the same title
// credited to the same artist (live versions and remasters come later;
// covers by other artists are ignored).

import { foldName, normalizeTitle } from "@/lib/game/normalize";

import type { MusicBrainzRecording } from "./types";

const LEADING_ARTICLE = /^(os|as|o|a|the) /;

/** "Os Paralamas do Sucesso" and "Paralamas do Sucesso" compare equal. */
function artistKey(name: string): string {
  return foldName(name).replace(LEADING_ARTICLE, "");
}

function creditedTo(recording: MusicBrainzRecording, artist: string): boolean {
  const key = artistKey(artist);
  return (recording["artist-credit"] ?? []).some(
    (credit) => artistKey(credit.name) === key || artistKey(credit.artist.name) === key,
  );
}

/**
 * Title without bracketed segments, which on Deezer are often a translation
 * or the original of a version ("O Amor e o Poder (The Power of Love)").
 */
export function searchTitle(title: string): string {
  return title.replace(/\s*[([][^()[\]]*[)\]]/g, " ").replace(/\s+/g, " ").trim() || title;
}

/** Spacing differs between sources: "3x4" and "3 X 4" compare equal. */
function titleKey(title: string): string {
  return normalizeTitle(searchTitle(title)).replace(/ /g, "");
}

function releaseYear(recording: MusicBrainzRecording): number | null {
  const match = /^(\d{4})/.exec(recording["first-release-date"] ?? "");
  return match ? Number(match[1]) : null;
}

export function earliestReleaseYear(
  recordings: readonly MusicBrainzRecording[],
  title: string,
  artist: string,
): number | null {
  const key = titleKey(title);
  let earliest: number | null = null;
  for (const recording of recordings) {
    if (titleKey(recording.title) !== key || !creditedTo(recording, artist)) continue;
    const year = releaseYear(recording);
    if (year !== null && (earliest === null || year < earliest)) earliest = year;
  }
  return earliest;
}

/** Lucene query for a recording by title and artist. */
export function recordingQuery(title: string, artist: string): string {
  const quote = (text: string) => `"${text.replace(/["\\]/g, "\\$&")}"`;
  return `recording:${quote(title)} AND artist:${quote(artist)}`;
}
