import type { HardcoreArtistResponse } from "@/lib/api/types";
import { saveAnswer, saveArtistGuess } from "@/lib/rooms/store";
import { isValidChoice, json, jsonError, readJsonObject, revealAnswer } from "@/lib/server/http";
import { findPlayerRound } from "@/lib/server/rooms";

/**
 * Step 1 of a round in a hardcore room. Body: `{ choice: 0-3 }`, once per
 * round. Right: returns the song options of step 2. Wrong: the round ends
 * with 0 points and the answer is revealed.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/rooms/[code]/[index]/artist">) {
  const answeredAt = Date.now();
  const body = await readJsonObject(request);
  if (!body || !isValidChoice(body.choice)) return jsonError(400, "Palpite inválido.");

  const found = await findPlayerRound(await ctx.params, answeredAt);
  if (!found.ok) return found.response;
  const { room, index, playerId, elapsedMs } = found.value;
  if (!room.hardcore) return jsonError(404, "Esta sala não é do modo Hardcore.");

  const round = room.rounds[index];
  const artist = {
    choice: body.choice,
    answerIndex: round.artistAnswerIndex,
    correct: body.choice === round.artistAnswerIndex,
  };
  if (!(await saveArtistGuess(room, playerId, index, artist))) {
    return jsonError(409, "Você já escolheu o artista desta rodada.");
  }

  if (artist.correct) {
    return json<HardcoreArtistResponse>({ correct: true, answerIndex: artist.answerIndex, songs: round.songOptions });
  }
  const answer = await revealAnswer(round);
  await saveAnswer(room, playerId, index, {
    choice: artist.choice,
    answerIndex: artist.answerIndex,
    correct: false,
    points: 0,
    hardcore: { artist, songs: null },
    answeredAt,
    elapsedMs,
    answer,
  });
  return json<HardcoreArtistResponse>({ correct: false, answerIndex: artist.answerIndex, answer });
}
