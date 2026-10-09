import { APP_NAME } from "./config";
import { formatGameDate } from "./date";
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

export interface RoomShareInput {
  categoryName: string;
  results: boolean[];
  hardMode: boolean;
  totalMs: number;
  /** Position among the players who finished so far, if any. */
  position: { place: number; of: number } | null;
  url?: string;
}

/** Text shared at the end of a room. Never includes song titles. */
export function roomShareText(input: RoomShareInput): string {
  const score = input.results.filter(Boolean).length;
  const details = [`${score}/${input.results.length}`, formatDuration(input.totalMs)];
  if (input.position) details.push(`${input.position.place}º de ${input.position.of}`);
  if (input.hardMode) details.push("modo difícil 🔥");
  const lines = [
    `${APP_NAME} · Desafio ${input.categoryName}`,
    details.join(" · "),
    resultEmojis(input.results),
  ];
  if (input.url) lines.push(input.url);
  return lines.join("\n");
}

/** Invitation to a room. */
export function roomInviteText(categoryName: string, roundCount: number, url: string): string {
  return `Te desafio no ${APP_NAME}! ${roundCount} músicas de ${categoryName}. Quem acerta mais?\n${url}`;
}
