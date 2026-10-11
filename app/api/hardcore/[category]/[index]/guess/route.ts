import { findDailyRound } from "@/lib/server/daily";
import { guessResponse, readDailyGuess } from "@/lib/server/http";

/**
 * Step 2 of a hardcore round. Body: `{ choice: 0-3, date?: "YYYY-MM-DD" }`.
 * Returns the result and the answer.
 */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/hardcore/[category]/[index]/guess">,
) {
  const guess = await readDailyGuess(request);
  if (!guess.ok) return guess.response;

  const { category, index } = await ctx.params;
  const found = await findDailyRound(category, index, guess.date, new Date(), "hardcore");
  if (!found.ok) return found.response;

  const round = found.value;
  return guessResponse(guess.choice, round.songAnswerIndex, round);
}
