import "server-only";

import { gameDate, isIsoDate } from "@/lib/game/date";
import type { HardcoreDay } from "@/lib/game/hardcore";
import type { ScheduleDay } from "@/lib/game/schedule";

import { getCategory, getHardcoreSchedule, getSchedule } from "./data";
import { jsonError } from "./http";

type Result<T> = { ok: true; value: T } | { ok: false; response: Response };

/** Daily challenges: the normal one and the hardcore one. */
export type DailyMode = "daily" | "hardcore";

interface DayOf {
  daily: ScheduleDay;
  hardcore: HardcoreDay;
}

type RoundOf<M extends DailyMode> = DayOf[M]["rounds"][number];

const SCHEDULES = { daily: getSchedule, hardcore: getHardcoreSchedule };

/**
 * Finds the challenge of a category for `requestedDate` (default: today in
 * São Paulo). Future dates are never served. Past dates are allowed so a
 * round started before midnight can still be finished after it.
 */
export async function findDailyDay<M extends DailyMode = "daily">(
  categorySlug: string,
  requestedDate: string | null | undefined,
  now: Date,
  mode: M = "daily" as M,
): Promise<Result<{ date: string; day: DayOf[M] }>> {
  const category = await getCategory(categorySlug);
  if (!category) return { ok: false, response: jsonError(404, "Categoria não encontrada.") };

  const today = gameDate(now);
  const date = requestedDate ?? today;
  if (!isIsoDate(date)) return { ok: false, response: jsonError(400, "Data inválida.") };
  if (date > today) return { ok: false, response: jsonError(404, "Desafio ainda não disponível.") };

  const schedule = (await SCHEDULES[mode](category)) as { days: Record<string, DayOf[M]> } | null;
  const day = schedule?.days[date];
  if (!day) return { ok: false, response: jsonError(404, "Não há desafio para esta data.") };
  return { ok: true, value: { date, day } };
}

export async function findDailyRound<M extends DailyMode = "daily">(
  categorySlug: string,
  indexParam: string,
  requestedDate: string | null | undefined,
  now: Date,
  mode: M = "daily" as M,
): Promise<Result<RoundOf<M>>> {
  const found = await findDailyDay(categorySlug, requestedDate, now, mode);
  if (!found.ok) return found;
  const index = /^\d+$/.test(indexParam) ? Number(indexParam) : -1;
  const round = found.value.day.rounds[index] as RoundOf<M> | undefined;
  if (!round) return { ok: false, response: jsonError(404, "Rodada não encontrada.") };
  return { ok: true, value: round };
}
