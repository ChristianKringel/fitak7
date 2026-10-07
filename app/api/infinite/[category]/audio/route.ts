import { findInfiniteRound } from "@/lib/server/infinite";
import { audioRedirect, jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** `?token=` from the round endpoint. Redirects (302) to a fresh preview. */
export async function GET(request: Request, ctx: RouteContext<"/api/infinite/[category]/audio">) {
  const { category } = await ctx.params;
  const token = new URL(request.url).searchParams.get("token");
  const found = await findInfiniteRound(token, Date.now());
  if (!found.ok) return found.response;

  const { round, song } = found.value;
  if (round.category !== category) return jsonError(400, "Rodada inválida ou expirada.");
  return audioRedirect([round.trackId, ...song.altTrackIds]);
}
