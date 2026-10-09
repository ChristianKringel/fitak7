import type { GuessResponse } from "@/lib/api/types";
import { roundElapsedMs } from "@/lib/game/room";
import { getPlayerAnswers, getRoundStart, saveAnswer } from "@/lib/rooms/store";
import { isValidChoice, json, jsonError, readJsonObject, revealAnswer } from "@/lib/server/http";
import { findRoom, parseRoundIndex, requirePlayer } from "@/lib/server/rooms";

/** Body: `{ choice: 0-3 }`. One guess per round, in order. Returns the result and the answer. */
export async function POST(request: Request, ctx: RouteContext<"/api/rooms/[code]/[index]/guess">) {
  const answeredAt = Date.now();
  const body = await readJsonObject(request);
  if (!body || !isValidChoice(body.choice)) return jsonError(400, "Palpite inválido.");

  const params = await ctx.params;
  const found = await findRoom(params.code);
  if (!found.ok) return found.response;
  const room = found.value;
  const index = parseRoundIndex(params.index, room);
  if (index === null) return jsonError(404, "Rodada não encontrada.");
  const player = await requirePlayer(room);
  if (!player.ok) return player.response;

  const { id, player: stored } = player.value;
  const [answers, audioStartedAt] = await Promise.all([
    getPlayerAnswers(room, id),
    getRoundStart(room, id, index),
  ]);
  if (index < answers.length) return jsonError(409, "Você já respondeu esta rodada.");
  if (index > answers.length) return jsonError(403, "Responda as rodadas anteriores primeiro.");

  const round = room.rounds[index];
  const correct = body.choice === round.answerIndex;
  const elapsedMs = roundElapsedMs({
    answeredAt,
    audioStartedAt,
    previousAnsweredAt: answers.at(-1)?.answeredAt ?? null,
    joinedAt: stored.joinedAt,
  });
  const answer = await revealAnswer(round);
  const saved = await saveAnswer(room, id, index, {
    choice: body.choice,
    answerIndex: round.answerIndex,
    correct,
    answeredAt,
    elapsedMs,
    answer,
  });
  if (!saved) return jsonError(409, "Você já respondeu esta rodada.");

  return json<GuessResponse>({ correct, answerIndex: round.answerIndex, answer });
}
