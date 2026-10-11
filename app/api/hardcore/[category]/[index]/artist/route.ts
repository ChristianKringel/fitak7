import type { HardcoreArtistResponse } from "@/lib/api/types";
import { findDailyRound } from "@/lib/server/daily";
import { json, readDailyGuess, revealAnswer } from "@/lib/server/http";

/**
 * Step 1 of a hardcore round. Body: `{ choice: 0-3, date?: "YYYY-MM-DD" }`.
 * Right: returns the song options of step 2. Wrong: the round is over and
 * the answer is revealed.
 */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/hardcore/[category]/[index]/artist">,
) {
  const guess = await readDailyGuess(request);
  if (!guess.ok) return guess.response;

  const { category, index } = await ctx.params;
  const found = await findDailyRound(category, index, guess.date, new Date(), "hardcore");
  if (!found.ok) return found.response;

  const round = found.value;
  const answerIndex = round.artistAnswerIndex;
  if (guess.choice === answerIndex) {
    return json<HardcoreArtistResponse>({ correct: true, answerIndex, songs: round.songOptions });
  }
  return json<HardcoreArtistResponse>({ correct: false, answerIndex, answer: await revealAnswer(round) });
}
