// Browser-side calls to our route handlers.

import type {
  ApiError,
  CreateRoomRequest,
  DailyChallengeResponse,
  GuessResponse,
  InfiniteRoundResponse,
  RoomCodeResponse,
  RoomResponse,
} from "./types";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    });
  } catch {
    throw new ApiRequestError("Sem conexão. Verifique sua internet e tente de novo.", 0);
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (body as ApiError | null)?.error ?? "Algo deu errado. Tente de novo.";
    throw new ApiRequestError(message, response.status);
  }
  return body as T;
}

const post = <T>(url: string, body: unknown) =>
  request<T>(url, { method: "POST", body: JSON.stringify(body) });

const enc = encodeURIComponent;

export const api = {
  daily: (category: string) => request<DailyChallengeResponse>(`/api/daily/${enc(category)}`),
  dailyAudioUrl: (category: string, index: number, date: string) =>
    `/api/daily/${enc(category)}/${index}/audio?date=${enc(date)}`,
  dailyGuess: (category: string, index: number, choice: number, date: string) =>
    post<GuessResponse>(`/api/daily/${enc(category)}/${index}/guess`, { choice, date }),

  infiniteRound: (category: string, recent: string[]) =>
    post<InfiniteRoundResponse>(`/api/infinite/${enc(category)}/round`, { recent }),
  infiniteAudioUrl: (category: string, token: string) =>
    `/api/infinite/${enc(category)}/audio?token=${enc(token)}`,
  infiniteGuess: (category: string, token: string, choice: number) =>
    post<GuessResponse>(`/api/infinite/${enc(category)}/guess`, { token, choice }),

  createRoom: (body: CreateRoomRequest) => post<RoomCodeResponse>("/api/rooms", body),
  room: (code: string) => request<RoomResponse>(`/api/rooms/${enc(code)}`),
  joinRoom: (code: string, name: string) => post<RoomCodeResponse>(`/api/rooms/${enc(code)}/join`, { name }),
  rematch: (code: string) => post<RoomCodeResponse>(`/api/rooms/${enc(code)}/rematch`, {}),
  roomAudioUrl: (code: string, index: number) => `/api/rooms/${enc(code)}/${index}/audio`,
  roomGuess: (code: string, index: number, choice: number) =>
    post<GuessResponse>(`/api/rooms/${enc(code)}/${index}/guess`, { choice }),
};
