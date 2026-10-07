import "server-only";

import type { PoolSong } from "@/lib/game/pool";
import { getRoundKey, openRound, type RoundPayload } from "@/lib/rounds/token";

import { getCategory, getPool } from "./data";
import { jsonError } from "./http";

type Result<T> = { ok: true; value: T } | { ok: false; response: Response };

/** Decrypts a round token and finds its song in the current pool. */
export async function findInfiniteRound(
  token: unknown,
  now: number,
): Promise<Result<{ round: RoundPayload; song: PoolSong }>> {
  const round = typeof token === "string" ? openRound(token, getRoundKey(), { now }) : null;
  if (!round) return { ok: false, response: jsonError(400, "Rodada inválida ou expirada.") };

  const category = await getCategory(round.category);
  const song = category
    ? (await getPool(category))?.songs.find((s) => s.id === round.songId)
    : undefined;
  // The pool can change between deploys; old tokens then stop working.
  if (!song) return { ok: false, response: jsonError(410, "Rodada não está mais disponível.") };
  return { ok: true, value: { round, song } };
}
