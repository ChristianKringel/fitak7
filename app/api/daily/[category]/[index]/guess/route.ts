import { findDailyRound } from "@/lib/server/daily";
import { guessResponse, isValidChoice, jsonError, readJsonObject } from "@/lib/server/http";

/** Body: `{ choice: 0-3, date?: "YYYY-MM-DD" }`. Returns the result and the answer. */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/daily/[category]/[index]/guess">,
) {
  const body = await readJsonObject(request);
  if (!body || !isValidChoice(body.choice)) return jsonError(400, "Palpite inválido.");
  if (body.date !== undefined && typeof body.date !== "string") {
    return jsonError(400, "Data inválida.");
  }

  const { category, index } = await ctx.params;
  const found = await findDailyRound(category, index, body.date, new Date());
  if (!found.ok) return found.response;

  const round = found.value;
  return guessResponse(body.choice, round.answerIndex, round);
}
