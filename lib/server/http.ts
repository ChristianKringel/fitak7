import "server-only";

import type { ApiError, GuessResponse, RevealedAnswer } from "@/lib/api/types";
import { getTrack, resolvePreview } from "@/lib/deezer/tracks";
import { OPTIONS_PER_ROUND } from "@/lib/game/options";

const NO_STORE = { "Cache-Control": "no-store" };

export function json<T>(body: T, status = 200): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

export function jsonError(status: number, message: string): Response {
  return json<ApiError>({ error: message }, status);
}

/** Parses a JSON object body; null when missing or invalid. */
export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function isValidChoice(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) < OPTIONS_PER_ROUND;
}

/** Redirects to a fresh preview URL of the first playable version. */
export async function audioRedirect(trackIds: readonly number[]): Promise<Response> {
  const preview = await resolvePreview(trackIds);
  if (!preview) return jsonError(503, "Prévia indisponível no momento.");
  return new Response(null, { status: 302, headers: { Location: preview, ...NO_STORE } });
}

/** Song details shown after a guess; album info is best-effort. */
export async function revealAnswer(song: {
  title: string;
  artist: string;
  trackId: number;
}): Promise<RevealedAnswer> {
  // Details are best-effort: the guess result must not depend on Deezer.
  const track = await getTrack(song.trackId).catch(() => null);
  return {
    title: song.title,
    artist: song.artist,
    album: track?.album.title ?? null,
    cover: track?.album.cover_big ?? track?.album.cover_medium ?? null,
    link: track?.link ?? null,
  };
}

export async function guessResponse(
  choice: number,
  answerIndex: number,
  song: { title: string; artist: string; trackId: number },
): Promise<Response> {
  const answer = await revealAnswer(song);
  return json<GuessResponse>({ correct: choice === answerIndex, answerIndex, answer });
}
