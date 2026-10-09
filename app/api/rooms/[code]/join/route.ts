import { cleanNickname } from "@/lib/game/room";
import { json, jsonError, readJsonObject } from "@/lib/server/http";
import { findRoom, joinWithCookie } from "@/lib/server/rooms";

/** Body: `{ name }`. Sets the player cookie of the room. */
export async function POST(request: Request, ctx: RouteContext<"/api/rooms/[code]/join">) {
  const body = await readJsonObject(request);
  const name = cleanNickname(body?.name);
  if (!name) return jsonError(400, "Escolha um apelido de até 20 caracteres.");

  const found = await findRoom((await ctx.params).code);
  if (!found.ok) return found.response;

  const failed = await joinWithCookie(found.value, name, Date.now());
  return failed ?? json({ code: found.value.code });
}
