export const APP_NAME = "Musicle RS";

/** Clip length in seconds, per mode. */
export const NORMAL_CLIP_SECONDS = 15;
export const HARD_CLIP_SECONDS = 5;

export function clipSeconds(hardMode: boolean): number {
  return hardMode ? HARD_CLIP_SECONDS : NORMAL_CLIP_SECONDS;
}
