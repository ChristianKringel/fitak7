import type { DailyChallengeResponse } from "@/lib/api/types";
import { findDailyDay } from "@/lib/server/daily";
import { json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Today's 5 rounds (option titles only). `?date=` allows today or earlier. */
export async function GET(request: Request, ctx: RouteContext<"/api/daily/[category]">) {
  const { category } = await ctx.params;
  const date = new URL(request.url).searchParams.get("date");
  const found = await findDailyDay(category, date, new Date());
  if (!found.ok) return found.response;

  return json<DailyChallengeResponse>({
    category,
    date: found.value.date,
    rounds: found.value.day.rounds.map((round) => ({ options: round.options })),
  });
}
