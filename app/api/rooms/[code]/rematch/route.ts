import type { RoomCodeResponse } from "@/lib/api/types";
import { getRematch, getRoom, linkRematch } from "@/lib/rooms/store";
import { json } from "@/lib/server/http";
import { findRoom, joinWithCookie, newRoom, requirePlayer } from "@/lib/server/rooms";

/**
 * Creates (or reuses) the rematch room, with the same settings and new
 * songs, and joins the player to it with the same nickname.
 */
export async function POST(_request: Request, ctx: RouteContext<"/api/rooms/[code]/rematch">) {
  const found = await findRoom((await ctx.params).code);
  if (!found.ok) return found.response;
  const room = found.value;
  const player = await requirePlayer(room);
  if (!player.ok) return player.response;

  const now = Date.now();
  const existing = await getRematch(room.code);
  let target = existing ? await getRoom(existing) : null;
  if (!target) {
    const created = await newRoom(
      { category: room.category, roundCount: room.roundCount, hardMode: room.hardMode },
      now,
    );
    if (!created.ok) return created.response;
    const code = await linkRematch(room, created.value.code);
    // Someone else linked a rematch first: use theirs.
    target = code === created.value.code ? created.value : await getRoom(code);
    if (!target) target = created.value;
  }

  // Name taken or room full: the player still gets the code and can join by hand.
  await joinWithCookie(target, player.value.player.name, now);
  return json<RoomCodeResponse>({ code: target.code });
}
