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

export interface CreateRoomRequest {
  category: string;
  roundCount: number;
  hardMode: boolean;
  name: string;
}

export interface JoinRoomRequest {
  name: string;
}

export interface RoomCodeResponse {
  code: string;
}

export interface RoomStanding {
  name: string;
  answered: number;
  correct: number;
  totalMs: number;
  finished: boolean;
  /** null while still playing. */
  position: number | null;
  me: boolean;
}

export interface RoomRoundRecord {
  choice: number;
  answerIndex: number;
  correct: boolean;
  elapsedMs: number;
  answer: RevealedAnswer;
}

export interface RoomResponse {
  code: string;
  category: { slug: string; name: string };
  roundCount: number;
  hardMode: boolean;
  createdAt: number;
  expiresAt: number;
  maxPlayers: number;
  standings: RoomStanding[];
  /** Code of the rematch room, once someone created it. */
  rematch: string | null;
  /** Only for players of the room. */
  me: {
    name: string;
    rounds: { options: RoundOption[] }[];
    /** Answered rounds, in order. */
    answers: RoomRoundRecord[];
  } | null;
}
