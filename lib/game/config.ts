export const APP_NAME = "Fita K7";

/** Clip length in seconds, per mode. */
export const NORMAL_CLIP_SECONDS = 15;
export const HARD_CLIP_SECONDS = 5;

export function clipSeconds(hardMode: boolean): number {
  return hardMode ? HARD_CLIP_SECONDS : NORMAL_CLIP_SECONDS;
}

/**
 * Only this share of each artist's most popular songs (by Deezer rank) can be
 * the answer of a round, but never fewer than MIN_TOP_SONGS_PER_ARTIST. Less
 * popular songs still show up as wrong options.
 */
export const TOP_SHARE_PER_ARTIST = 0.1;
export const MIN_TOP_SONGS_PER_ARTIST = 3;
