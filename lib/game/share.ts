import { APP_NAME } from "./config";
import { formatGameDate } from "./date";

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
