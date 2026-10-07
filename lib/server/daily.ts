import "server-only";

import { gameDate, isIsoDate } from "@/lib/game/date";
import type { ScheduleDay, ScheduledRound } from "@/lib/game/schedule";

import { getCategory, getSchedule } from "./data";
import { jsonError } from "./http";

type Result<T> = { ok: true; value: T } | { ok: false; response: Response };

/**
 * Finds the challenge of a category for `requestedDate` (default: today in
 * São Paulo). Future dates are never served. Past dates are allowed so a
 * round started before midnight can still be finished after it.
 */
export async function findDailyDay(
  categorySlug: string,
  requestedDate: string | null | undefined,
  now: Date,
): Promise<Result<{ date: string; day: ScheduleDay }>> {
  const category = await getCategory(categorySlug);
  if (!category) return { ok: false, response: jsonError(404, "Categoria não encontrada.") };

  const today = gameDate(now);
  const date = requestedDate ?? today;
  if (!isIsoDate(date)) return { ok: false, response: jsonError(400, "Data inválida.") };
  if (date > today) return { ok: false, response: jsonError(404, "Desafio ainda não disponível.") };

  const day = (await getSchedule(category))?.days[date];
  if (!day) return { ok: false, response: jsonError(404, "Não há desafio para esta data.") };
  return { ok: true, value: { date, day } };
}

export async function findDailyRound(
  categorySlug: string,
  indexParam: string,
  requestedDate: string | null | undefined,
  now: Date,
): Promise<Result<ScheduledRound>> {
  const found = await findDailyDay(categorySlug, requestedDate, now);
  if (!found.ok) return found;
  const index = /^\d+$/.test(indexParam) ? Number(indexParam) : -1;
  const round = found.value.day.rounds[index];
  if (!round) return { ok: false, response: jsonError(404, "Rodada não encontrada.") };
  return { ok: true, value: round };
}
