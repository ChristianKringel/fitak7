export const APP_NAME = "Fita K7";

/** Clip length in seconds, per mode. */
export const NORMAL_CLIP_SECONDS = 15;
export const HARD_CLIP_SECONDS = 5;

export function clipSeconds(hardMode: boolean): number {
  return hardMode ? HARD_CLIP_SECONDS : NORMAL_CLIP_SECONDS;
}

/**
 * Only each artist's N most popular songs (by Deezer rank) can be the answer
 * of a round. Less popular songs still show up as wrong options.
 */
export const TOP_SONGS_PER_ARTIST = 30;
