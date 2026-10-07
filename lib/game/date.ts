// Game dates are calendar days ("YYYY-MM-DD") in São Paulo time.
// Nothing here reads the current time; callers pass it in.

export const GAME_TIME_ZONE = "America/Sao_Paulo";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

/** Calendar date of `instant` in the given time zone. */
export function gameDate(instant: Date, timeZone = GAME_TIME_ZONE): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export function addDays(date: string, days: number): string {
  const time = new Date(`${date}T00:00:00Z`).getTime() + days * DAY_MS;
  return new Date(time).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round(
    (new Date(`${to}T00:00:00Z`).getTime() -
      new Date(`${from}T00:00:00Z`).getTime()) /
      DAY_MS,
  );
}

/** "2026-10-06" -> "06/10/2026". */
export function formatGameDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

/** Milliseconds from `now` until the next game day starts (midnight in São Paulo). */
export function msUntilNextGameDay(now: Date, timeZone = GAME_TIME_ZONE): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const elapsed = (get("hour") * 3600 + get("minute") * 60 + get("second")) * 1000 + now.getMilliseconds();
  return 24 * 60 * 60 * 1000 - elapsed;
}
