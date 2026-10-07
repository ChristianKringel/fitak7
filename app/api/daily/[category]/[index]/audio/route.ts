import { findDailyRound } from "@/lib/server/daily";
import { audioRedirect } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Redirects (302) to a fresh Deezer preview of the round's song. */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/daily/[category]/[index]/audio">,
) {
  const { category, index } = await ctx.params;
  const date = new URL(request.url).searchParams.get("date");
  const found = await findDailyRound(category, index, date, new Date());
  if (!found.ok) return found.response;

  const round = found.value;
  return audioRedirect([round.trackId, ...round.altTrackIds]);
}
