import { APP_NAME } from "./config";
import { formatGameDate } from "./date";
import { HARDCORE_MAX_SCORE, HARDCORE_POINTS_PER_ROUND } from "./hardcore";
import { formatDuration } from "./room";

export interface ShareInput {
  categoryName: string;
  date: string;
  /** One entry per round, in order. */
  results: boolean[];
  /** Every round was played in hard mode. */
  hardMode: boolean;
  url?: string;
}

export function resultEmojis(results: readonly boolean[]): string {
  return results.map((correct) => (correct ? "🟩" : "🟥")).join("");
}

/** Text shared at the end of the daily challenge. Never includes song titles. */
export function shareText(input: ShareInput): string {
  const score = input.results.filter(Boolean).length;
  const lines = [
    `${APP_NAME} · ${input.categoryName}`,
    `${formatGameDate(input.date)} · ${score}/${input.results.length}${input.hardMode ? " · modo difícil 🔥" : ""}`,
    resultEmojis(input.results),
  ];
  if (input.url) lines.push(input.url);
  return lines.join("\n");
}

export interface HardcoreShareInput {
  categoryName: string;
  date: string;
  /** Points of each round, in order: 0 (wrong artist), 1 (artist only) or 2. */
  points: number[];
  /** Every round was played in hard mode. */
  hardMode: boolean;
  url?: string;
}

export function hardcoreEmojis(points: readonly number[]): string {
  return points.map((p) => (p >= 2 ? "🟩" : p === 1 ? "🟨" : "🟥")).join("");
}

/** Text shared at the end of the hardcore challenge. Never includes song titles. */
export function hardcoreShareText(input: HardcoreShareInput): string {
  const score = input.points.reduce((sum, p) => sum + p, 0);
  const lines = [
    `${APP_NAME} · Hardcore 💀 · ${input.categoryName}`,
    `${formatGameDate(input.date)} · ${score}/${HARDCORE_MAX_SCORE}${input.hardMode ? " · modo difícil 🔥" : ""}`,
    hardcoreEmojis(input.points),
  ];
  if (input.url) lines.push(input.url);
  return lines.join("\n");
}

export interface RoomShareInput {
  categoryName: string;
  results: boolean[];
  /** Hardcore rooms: points of each round (0 to 2), shown instead of `results`. */
  hardcorePoints?: number[];
  hardMode: boolean;
  totalMs: number;
  /** Position among the players who finished so far, if any. */
  position: { place: number; of: number } | null;
  url?: string;
}

/** Text shared at the end of a room. Never includes song titles. */
export function roomShareText(input: RoomShareInput): string {
  const points = input.hardcorePoints;
  const score = points ? points.reduce((sum, p) => sum + p, 0) : input.results.filter(Boolean).length;
  const max = points ? points.length * HARDCORE_POINTS_PER_ROUND : input.results.length;
  const details = [`${score}/${max}`, formatDuration(input.totalMs)];
  if (input.position) details.push(`${input.position.place}º de ${input.position.of}`);
  if (points) details.push("Hardcore 💀");
  else if (input.hardMode) details.push("modo difícil 🔥");
  const lines = [
    `${APP_NAME} · Desafio ${input.categoryName}`,
    details.join(" · "),
    points ? hardcoreEmojis(points) : resultEmojis(input.results),
  ];
  if (input.url) lines.push(input.url);
  return lines.join("\n");
}

/** Invitation to a room. */
export function roomInviteText(categoryName: string, roundCount: number, url: string): string {
  return `Te desafio no ${APP_NAME}! ${roundCount} músicas de ${categoryName}. Quem acerta mais?\n${url}`;
}
