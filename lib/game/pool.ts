// Turns an artist's raw Deezer tracks into playable songs: filters unusable
// tracks and groups versions of the same song under one entry.

import {
  displayTitle,
  hasVersionMarker,
  isMedley,
  isVersionAlbumTitle,
  normalizeTitle,
  slugify,
} from "./normalize";

/** Tracks shorter than this are intros, vignettes etc. */
export const MIN_TRACK_SECONDS = 60;

export interface TrackCandidate {
  trackId: number;
  title: string;
  duration: number;
  hasPreview: boolean;
  readable: boolean;
  /** Deezer popularity score. */
  rank: number;
  trackArtistId: number;
  album: PoolAlbum;
}

export interface PoolAlbum {
  id: number;
  title: string;
  releaseDate: string;
  recordType: string;
}

export interface PoolSong {
  /** Stable id: artist slug + normalized title. Independent of Deezer IDs. */
  id: string;
  /** Display title, version markers removed. */
  title: string;
  artist: string;
  artistDeezerId: number;
  /** Preferred version (oldest studio album version). */
  trackId: number;
  /** Other versions of the same song (live, remaster, compilations...). */
  altTrackIds: number[];
  album: PoolAlbum;
  duration: number;
  /** Highest Deezer rank among all versions (the famous one may be live). */
  rank: number;
  /** Position in the artist's popularity ranking, 1 = most popular. */
  topPosition: number;
  /** Original release year; only set in categories with `years`. */
  year?: number;
}

export interface CategoryPool {
  category: string;
  /**
   * Share of each artist's top songs that can be answers (see
   * `answerCandidates`); defaults to TOP_SHARE_PER_ARTIST. Hits lists use 1.
   */
  topShare?: number;
  songs: PoolSong[];
}

export type DiscardReason =
  | "other-artist"
  | "unreadable"
  | "no-preview"
  | "too-short"
  | "medley"
  | "excluded";

export interface SongGroup {
  song: PoolSong;
  versions: TrackCandidate[];
}

export interface ArtistSongsResult {
  groups: SongGroup[];
  discarded: Record<DiscardReason, number>;
}

export interface PoolArtist {
  name: string;
  deezerId: number;
  excludeTrackIds: number[];
}

export function songId(artistName: string, title: string): string {
  return `${slugify(artistName)}--${slugify(normalizeTitle(title))}`;
}

function discardReason(
  track: TrackCandidate,
  artist: PoolArtist,
): DiscardReason | null {
  if (track.trackArtistId !== artist.deezerId) return "other-artist";
  if (!track.readable) return "unreadable";
  if (!track.hasPreview) return "no-preview";
  if (track.duration < MIN_TRACK_SECONDS) return "too-short";
  if (isMedley(track.title)) return "medley";
  return null;
}

const RECORD_TYPE_RANK: Record<string, number> = {
  album: 0,
  ep: 1,
  single: 1,
  compile: 2,
};

/**
 * Sort key for picking the canonical version: unmarked studio versions
 * first, then full albums over singles/EPs over compilations, then oldest.
 */
function compareVersions(a: TrackCandidate, b: TrackCandidate): number {
  const marked = (t: TrackCandidate) =>
    hasVersionMarker(t.title) || isVersionAlbumTitle(t.album.title) ? 1 : 0;
  const rank = (t: TrackCandidate) => RECORD_TYPE_RANK[t.album.recordType] ?? 3;
  return (
    marked(a) - marked(b) ||
    rank(a) - rank(b) ||
    a.album.releaseDate.localeCompare(b.album.releaseDate) ||
    a.trackId - b.trackId
  );
}

export function buildArtistSongs(
  artist: PoolArtist,
  tracks: TrackCandidate[],
): ArtistSongsResult {
  const discarded: Record<DiscardReason, number> = {
    "other-artist": 0,
    unreadable: 0,
    "no-preview": 0,
    "too-short": 0,
    medley: 0,
    excluded: 0,
  };

  const seen = new Set<number>();
  const byKey = new Map<string, TrackCandidate[]>();
  for (const track of tracks) {
    if (seen.has(track.trackId)) continue;
    seen.add(track.trackId);
    const reason = discardReason(track, artist);
    if (reason) {
      discarded[reason]++;
      continue;
    }
    const key = normalizeTitle(track.title);
    const group = byKey.get(key);
    if (group) group.push(track);
    else byKey.set(key, [track]);
  }

  // Excluding any version of a song excludes the whole song.
  const excluded = new Set(artist.excludeTrackIds);
  const groups: SongGroup[] = [];
  for (const versions of byKey.values()) {
    if (versions.some((v) => excluded.has(v.trackId))) {
      discarded.excluded += versions.length;
      continue;
    }
    versions.sort(compareVersions);
    const [canonical, ...alts] = versions;
    groups.push({
      versions,
      song: {
        id: songId(artist.name, canonical.title),
        title: displayTitle(canonical.title),
        artist: artist.name,
        artistDeezerId: artist.deezerId,
        trackId: canonical.trackId,
        altTrackIds: alts.map((t) => t.trackId).sort((a, b) => a - b),
        album: canonical.album,
        duration: canonical.duration,
        rank: Math.max(...versions.map((v) => v.rank)),
        topPosition: 0, // set below, once all songs are known
      },
    });
  }

  [...groups]
    .sort((a, b) => b.song.rank - a.song.rank || a.song.id.localeCompare(b.song.id))
    .forEach((g, i) => {
      g.song.topPosition = i + 1;
    });

  groups.sort((a, b) => a.song.id.localeCompare(b.song.id));
  return { groups, discarded };
}
