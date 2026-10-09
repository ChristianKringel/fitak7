import type { RoomCodeResponse } from "@/lib/api/types";
import { cleanNickname, isValidRoundCount } from "@/lib/game/room";
import { json, jsonError, readJsonObject } from "@/lib/server/http";
import { joinWithCookie, newRoom } from "@/lib/server/rooms";

/** Body: `{ category, roundCount: 5-20, hardMode, name }`. Creates the room and joins its creator. */
export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const name = cleanNickname(body?.name);
  if (!body || typeof body.category !== "string") return jsonError(400, "Escolha uma categoria.");
  if (!isValidRoundCount(body.roundCount)) return jsonError(400, "Número de rodadas inválido.");
  if (typeof body.hardMode !== "boolean") return jsonError(400, "Modo inválido.");
  if (!name) return jsonError(400, "Escolha um apelido de até 20 caracteres.");

  const now = Date.now();
  const created = await newRoom(
    { category: body.category, roundCount: body.roundCount, hardMode: body.hardMode },
    now,
  );
  if (!created.ok) return created.response;

  const room = created.value;
  const failed = await joinWithCookie(room, name, now);
  if (failed) return failed;
  return json<RoomCodeResponse>({ code: room.code }, 201);
}
