import "server-only";

import { cookies } from "next/headers";

import type { RoomResponse } from "@/lib/api/types";
import { OPTIONS_PER_ROUND } from "@/lib/game/options";
import { answerCandidates } from "@/lib/game/popularity";
import {
  buildRoomRounds,
  MAX_ROOM_PLAYERS,
  parseRoomCode,
  rankPlayers,
  ROOM_TTL_MS,
  type Room,
  type RoomSettings,
} from "@/lib/game/room";
import { createRoom, getPlayer, getRoom, getRoomState, joinRoom, newPlayerId, type StoredPlayer } from "@/lib/rooms/store";

import { getCategory, getPool } from "./data";
import { jsonError } from "./http";

type Result<T> = { ok: true; value: T } | { ok: false; response: Response };

const cookieName = (code: string) => `k7_room_${code}`;

export async function findRoom(codeParam: string): Promise<Result<Room>> {
  const code = parseRoomCode(codeParam);
  const room = code ? await getRoom(code) : null;
  if (!room) return { ok: false, response: jsonError(404, "Sala não encontrada ou expirada.") };
  return { ok: true, value: room };
}

/** The player of the room identified by the request cookie, if any. */
export async function currentPlayer(room: Room): Promise<{ id: string; player: StoredPlayer } | null> {
  const id = (await cookies()).get(cookieName(room.code))?.value;
  if (!id) return null;
  const player = await getPlayer(room.code, id);
  return player ? { id, player } : null;
}

export async function requirePlayer(room: Room): Promise<Result<{ id: string; player: StoredPlayer }>> {
  const found = await currentPlayer(room);
  if (!found) return { ok: false, response: jsonError(403, "Entre na sala para jogar.") };
  return { ok: true, value: found };
}

/**
 * Adds a player and sets their cookie. Joining again from the same browser
 * keeps the original nickname.
 */
export async function joinWithCookie(room: Room, name: string, now: number): Promise<Response | null> {
  if (await currentPlayer(room)) return null;
  const id = newPlayerId();
  const result = await joinRoom(room, id, { name, joinedAt: now });
  if (result === "taken") return jsonError(409, "Esse apelido já está em uso nesta sala.");
  if (result === "full") return jsonError(403, `Sala cheia (máximo de ${MAX_ROOM_PLAYERS} jogadores).`);
  (await cookies()).set(cookieName(room.code), id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(room.expiresAt),
  });
  return null;
}

export async function newRoom(settings: RoomSettings, now: number): Promise<Result<Room>> {
  const category = await getCategory(settings.category);
  if (!category) return { ok: false, response: jsonError(404, "Categoria não encontrada.") };
  const pool = await getPool(category);
  if (!pool || pool.songs.length < OPTIONS_PER_ROUND) {
    return { ok: false, response: jsonError(404, "Categoria ainda sem músicas.") };
  }
  if (answerCandidates(pool.songs, pool.topShare).songs.length < settings.roundCount) {
    return { ok: false, response: jsonError(400, "Esta categoria não tem músicas para tantas rodadas.") };
  }

  const room = await createRoom((code) => ({
    ...settings,
    code,
    createdAt: now,
    expiresAt: now + ROOM_TTL_MS,
    rounds: buildRoomRounds(pool.songs, settings.roundCount, Math.random, pool.topShare),
  }));
  return { ok: true, value: room };
}

/** What a visitor sees of the room. Options and answers only for its players. */
export async function roomView(room: Room): Promise<RoomResponse> {
  const [state, me, category] = await Promise.all([
    getRoomState(room),
    currentPlayer(room),
    getCategory(room.category),
  ]);
  const standings = rankPlayers(
    [...state.players].map(([id, player]) => ({
      id,
      name: player.name,
      joinedAt: player.joinedAt,
      answers: state.answers.get(id) ?? [],
    })),
    room.roundCount,
  );

  return {
    code: room.code,
    category: { slug: room.category, name: category?.name ?? room.category },
    roundCount: room.roundCount,
    hardMode: room.hardMode,
    createdAt: room.createdAt,
    expiresAt: room.expiresAt,
    maxPlayers: MAX_ROOM_PLAYERS,
    // Player ids authenticate players: never send them.
    standings: standings.map(({ id, ...standing }) => ({ ...standing, me: id === me?.id })),
    rematch: state.rematch,
    me: me && {
      name: me.player.name,
      rounds: room.rounds.map((round) => ({ options: round.options })),
      answers: (state.answers.get(me.id) ?? []).map((a) => ({
        choice: a.choice,
        answerIndex: a.answerIndex,
        correct: a.correct,
        elapsedMs: a.elapsedMs,
        answer: a.answer,
      })),
    },
  };
}

export function parseRoundIndex(param: string, room: Room): number | null {
  const index = /^\d+$/.test(param) ? Number(param) : -1;
  return index >= 0 && index < room.roundCount ? index : null;
}
