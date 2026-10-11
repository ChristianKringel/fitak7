// Request/response shapes shared by the route handlers and the client.
// Nothing here may reveal the answer before a guess.

import type { RoundOption } from "@/lib/game/options";

export type { RoundOption };

export interface DailyChallengeResponse {
  category: string;
  date: string;
  rounds: { options: RoundOption[] }[];
}

export interface HardcoreChallengeResponse {
  category: string;
  date: string;
  rounds: {
    /** Step 1: artist names. */
    artists: string[];
    /** Second of the preview where the clip starts. */
    clipStart: number;
  }[];
}

/** Result of step 1 of a hardcore round. */
export type HardcoreArtistResponse =
  | {
      correct: true;
      answerIndex: number;
      /** Step 2: song titles, all by the right artist. */
      songs: string[];
    }
  | {
      correct: false;
      answerIndex: number;
      /** The round is over. */
      answer: RevealedAnswer;
    };

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
  /** Artist first, then the song; forces hard mode. */
  hardcore?: boolean;
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
  /** Out of `RoomResponse.maxScore`. */
  points: number;
  totalMs: number;
  finished: boolean;
  /** null while still playing. */
  position: number | null;
  me: boolean;
}

export interface RoomRoundRecord {
  /** Hardcore rooms: the song guess, or the artist guess when it was wrong. */
  choice: number;
  answerIndex: number;
  correct: boolean;
  /** 0 or 1; in hardcore rooms 0 to 2. */
  points: number;
  /** Hardcore rooms only. */
  hardcore: { artistChoice: number; artistAnswerIndex: number; songs: string[] | null } | null;
  elapsedMs: number;
  answer: RevealedAnswer;
}

/** What a player sees of a round before answering it. */
export type RoomRoundView =
  | { options: RoundOption[] }
  /** Hardcore rooms: artists of step 1. */
  | { artists: string[]; clipStart: number };

export interface RoomResponse {
  code: string;
  category: { slug: string; name: string };
  roundCount: number;
  hardMode: boolean;
  hardcore: boolean;
  /** Best possible score: `roundCount`, doubled in hardcore rooms. */
  maxScore: number;
  createdAt: number;
  expiresAt: number;
  maxPlayers: number;
  standings: RoomStanding[];
  /** Code of the rematch room, once someone created it. */
  rematch: string | null;
  /** Only for players of the room. */
  me: {
    name: string;
    rounds: RoomRoundView[];
    /** Answered rounds, in order. */
    answers: RoomRoundRecord[];
    /** Hardcore rooms: the current round when its artist was right and the song is pending. */
    openStep: { artistChoice: number; artistAnswerIndex: number; songs: string[] } | null;
  } | null;
}
