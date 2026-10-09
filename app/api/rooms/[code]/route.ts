import type { RoomResponse } from "@/lib/api/types";
import { json } from "@/lib/server/http";
import { findRoom, roomView } from "@/lib/server/rooms";

export const dynamic = "force-dynamic";

/** Settings and standings; options and the player's own answers once joined. */
export async function GET(_request: Request, ctx: RouteContext<"/api/rooms/[code]">) {
  const found = await findRoom((await ctx.params).code);
  if (!found.ok) return found.response;
  return json<RoomResponse>(await roomView(found.value));
}
