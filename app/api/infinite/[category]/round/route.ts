import type { InfiniteRoundResponse } from "@/lib/api/types";
import { pickInfiniteSong } from "@/lib/game/infinite";
import {
  buildOptions,
  NotEnoughOptionsError,
  OPTIONS_PER_ROUND,
  toRoundOption,
} from "@/lib/game/options";
import { getRoundKey, openRound, sealRound } from "@/lib/rounds/token";
import { getCategory, getPool } from "@/lib/server/data";
import { json, jsonError, readJsonObject } from "@/lib/server/http";

/** Only the most recent tokens are considered, to bound the work per request. */
const MAX_RECENT_TOKENS = 300;

/**
 * Body: `{ recent?: string[] }` with the tokens of rounds already played in
 * this session; their songs are not picked again.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/infinite/[category]/round">) {
  const { category: slug } = await ctx.params;
  const category = await getCategory(slug);
  if (!category) return jsonError(404, "Categoria não encontrada.");
  const pool = await getPool(category);
  if (!pool || pool.songs.length < OPTIONS_PER_ROUND) {
    return jsonError(404, "Categoria ainda sem músicas.");
  }

  const body = (await readJsonObject(request)) ?? {};
  const recent = Array.isArray(body.recent) ? body.recent.slice(-MAX_RECENT_TOKENS) : [];
  const key = getRoundKey();
  const now = Date.now();
  const playedIds = recent.flatMap((token) => {
    if (typeof token !== "string") return [];
    // Exclusion only needs the song, so old tokens still count.
    const round = openRound(token, key, { now, maxAgeMs: Infinity });
    return round && round.category === slug ? [round.songId] : [];
  });

  const song = pickInfiniteSong(pool.songs, playedIds, Math.random);
  let options;
  try {
    options = buildOptions(song, pool.songs, Math.random);
  } catch (error) {
    if (error instanceof NotEnoughOptionsError) {
      return jsonError(503, "Não foi possível montar a rodada.");
    }
    throw error;
  }

  const token = sealRound(
    {
      category: slug,
      songId: song.id,
      trackId: song.trackId,
      answerIndex: options.answerIndex,
      issuedAt: now,
    },
    key,
  );
  return json<InfiniteRoundResponse>({ token, options: options.songs.map(toRoundOption) });
}
