import { findInfiniteRound } from "@/lib/server/infinite";
import { guessResponse, isValidChoice, jsonError, readJsonObject } from "@/lib/server/http";

/** Body: `{ token, choice: 0-3 }`. Returns the result and the answer. */
export async function POST(request: Request, ctx: RouteContext<"/api/infinite/[category]/guess">) {
  const body = await readJsonObject(request);
  if (!body || !isValidChoice(body.choice)) return jsonError(400, "Palpite inválido.");

  const { category } = await ctx.params;
  const found = await findInfiniteRound(body.token, Date.now());
  if (!found.ok) return found.response;

  const { round, song } = found.value;
  if (round.category !== category) return jsonError(400, "Rodada inválida ou expirada.");
  return guessResponse(body.choice, round.answerIndex, song);
}
