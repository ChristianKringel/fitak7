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

/**
 * Hits lists (categories with `years`): each artist enters with their most
 * popular songs released in the category's years, up to a limit set per
 * artist and category in the catalog (`hits`; 7 for the decade's icons, 1 for
 * one-hit wonders) or HITS_DEFAULT_PER_ARTIST. Only songs among the artist's
 * HITS_CANDIDATES_PER_ARTIST most popular overall and with a Deezer rank of
 * at least HITS_MIN_RANK count, unless the catalog lists them in `include`.
 * Every song in a hits list can be the answer.
 */
export const HITS_DEFAULT_PER_ARTIST = 3;
export const HITS_CANDIDATES_PER_ARTIST = 40;
export const HITS_MIN_RANK = 300_000;

/**
 * The endless mode is hidden (pages and API answer 404) while the hardcore
 * mode takes its place. The code stays; flip this to bring it back.
 */
export const INFINITE_ENABLED = false;

/** Length of Deezer previews, in seconds. */
export const PREVIEW_SECONDS = 30;

/**
 * Hardcore mode: the clip starts at a random point of the preview, at least
 * this many seconds in, and early enough to fit the normal clip.
 */
export const HARDCORE_MIN_CLIP_START = 2;
/**
 * Hardcore mode: the wrong songs of the second step are drawn from the
 * artist's this many most popular songs, so none is easy to rule out.
 */
export const HARDCORE_STRONG_DECOYS = 8;
/** Popular songs of each artist kept as hardcore decoys in hits lists. */
export const HARDCORE_DECOYS_PER_ARTIST = 20;
