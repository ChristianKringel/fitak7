import { getPlayerAnswers, markRoundStart } from "@/lib/rooms/store";
import { audioRedirect, jsonError } from "@/lib/server/http";
import { findRoom, parseRoundIndex, requirePlayer } from "@/lib/server/rooms";

export const dynamic = "force-dynamic";

/**
 * Redirects (302) to a fresh Deezer preview. The first request of a round
 * starts its clock. Rounds after the player's current one are not served.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/rooms/[code]/[index]/audio">) {
  const params = await ctx.params;
  const found = await findRoom(params.code);
  if (!found.ok) return found.response;
  const room = found.value;
  const index = parseRoundIndex(params.index, room);
  if (index === null) return jsonError(404, "Rodada não encontrada.");
  const player = await requirePlayer(room);
  if (!player.ok) return player.response;

  const answered = (await getPlayerAnswers(room, player.value.id)).length;
  if (index > answered) return jsonError(403, "Responda as rodadas anteriores primeiro.");
  if (index === answered) await markRoundStart(room, player.value.id, index, Date.now());

  const round = room.rounds[index];
  return audioRedirect([round.trackId, ...round.altTrackIds]);
}
