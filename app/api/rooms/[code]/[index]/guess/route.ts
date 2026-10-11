import type { GuessResponse } from "@/lib/api/types";
import { getArtistGuess, saveAnswer, type StoredAnswer } from "@/lib/rooms/store";
import { isValidChoice, json, jsonError, readJsonObject, revealAnswer } from "@/lib/server/http";
import { findPlayerRound } from "@/lib/server/rooms";

/**
 * Body: `{ choice: 0-3 }`. One guess per round, in order. Returns the result
 * and the answer. In hardcore rooms, this is the song (step 2), only after a
 * right artist.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/rooms/[code]/[index]/guess">) {
  const answeredAt = Date.now();
  const body = await readJsonObject(request);
  if (!body || !isValidChoice(body.choice)) return jsonError(400, "Palpite inválido.");

  const found = await findPlayerRound(await ctx.params, answeredAt);
  if (!found.ok) return found.response;
  const { room, index, playerId, elapsedMs } = found.value;

  let stored: StoredAnswer;
  if (room.hardcore) {
    const round = room.rounds[index];
    const artist = await getArtistGuess(room, playerId, index);
    if (!artist?.correct) return jsonError(403, "Acerte o artista primeiro.");
    const correct = body.choice === round.songAnswerIndex;
    stored = {
      choice: body.choice,
      answerIndex: round.songAnswerIndex,
      correct,
      points: correct ? 2 : 1,
      hardcore: { artist, songs: round.songOptions },
      answeredAt,
      elapsedMs,
      answer: await revealAnswer(round),
    };
  } else {
    const round = room.rounds[index];
    const correct = body.choice === round.answerIndex;
    stored = {
      choice: body.choice,
      answerIndex: round.answerIndex,
      correct,
      points: correct ? 1 : 0,
      answeredAt,
      elapsedMs,
      answer: await revealAnswer(round),
    };
  }

  const saved = await saveAnswer(room, playerId, index, stored);
  if (!saved) return jsonError(409, "Você já respondeu esta rodada.");
  return json<GuessResponse>({ correct: stored.correct, answerIndex: stored.answerIndex, answer: stored.answer });
}
