// Request/response shapes shared by the route handlers and the client.
// Nothing here may reveal the answer before a guess.

import type { RoundOption } from "@/lib/game/options";

export type { RoundOption };

export interface DailyChallengeResponse {
  category: string;
  date: string;
  rounds: { options: RoundOption[] }[];
}

export interface InfiniteRoundRequest {
  /** Tokens of rounds already played in this session (most recent last). */
  recent?: string[];
}

export interface InfiniteRoundResponse {
  token: string;
  options: RoundOption[];
}

export interface DailyGuessRequest {
  choice: number;
  /** Date of the challenge being played; defaults to today. */
  date?: string;
}

export interface InfiniteGuessRequest {
  token: string;
  choice: number;
}

export interface RevealedAnswer {
  title: string;
  artist: string;
  album: string | null;
  cover: string | null;
  link: string | null;
}

export interface GuessResponse {
  correct: boolean;
  answerIndex: number;
  answer: RevealedAnswer;
}

export interface ApiError {
  error: string;
}
