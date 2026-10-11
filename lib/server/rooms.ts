import "server-only";

import { cookies } from "next/headers";

import type { RoomResponse } from "@/lib/api/types";
import { OPTIONS_PER_ROUND } from "@/lib/game/options";
import { answerCandidates } from "@/lib/game/popularity";
import {
  buildRoomHardcoreRounds,
  buildRoomRounds,
  MAX_ROOM_PLAYERS,
  parseRoomCode,
  rankPlayers,
  roomMaxScore,
  roundElapsedMs,
  ROOM_TTL_MS,
  type Room,
  type RoomSettings,
} from "@/lib/game/room";
import {
  answerPoints,
  createRoom,
  getArtistGuess,
  getPlayer,
  getPlayerAnswers,
  getRoom,
  getRoundStart,
  getRoomState,
  joinRoom,
  newPlayerId,
  type StoredPlayer,
} from "@/lib/rooms/store";

import { getCategory, getGenreLookup, getPool } from "./data";
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

  const base = { ...settings, createdAt: now, expiresAt: now + ROOM_TTL_MS };
  let build: (code: string) => Room;
  if (settings.hardcore) {
    const input = { pool: pool.songs, decoys: pool.decoys, genreOf: await getGenreLookup(category), topShare: pool.topShare };
    let rounds;
    try {
      rounds = buildRoomHardcoreRounds(input, settings.roundCount, Math.random);
    } catch (error) {
      // Too few artists or songs with 3 strong decoys for this many rounds.
      if (!(error instanceof Error)) throw error;
      return { ok: false, response: jsonError(400, "Esta categoria não tem músicas para tantas rodadas no Hardcore.") };
    }
    // Hardcore rooms always use the hard clip.
    build = (code) => ({ ...base, hardMode: true, hardcore: true, code, rounds });
  } else {
    const rounds = buildRoomRounds(pool.songs, settings.roundCount, Math.random, pool.topShare);
    build = (code) => ({ ...base, hardcore: false, code, rounds });
  }
  return { ok: true, value: await createRoom(build) };
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
      answers: (state.answers.get(id) ?? []).map((a) => ({ points: answerPoints(a), elapsedMs: a.elapsedMs })),
    })),
    room.roundCount,
  );

  const myAnswers = me ? (state.answers.get(me.id) ?? []) : [];
  // Hardcore: the current round may have its artist right and the song pending.
  const pendingArtist =
    me && room.hardcore && myAnswers.length < room.roundCount
      ? await getArtistGuess(room, me.id, myAnswers.length)
      : null;
  const openRound = room.hardcore ? room.rounds[myAnswers.length] : undefined;

  return {
    code: room.code,
    category: { slug: room.category, name: category?.name ?? room.category },
    roundCount: room.roundCount,
    hardMode: room.hardMode,
    hardcore: room.hardcore === true,
    maxScore: roomMaxScore(room),
    createdAt: room.createdAt,
    expiresAt: room.expiresAt,
    maxPlayers: MAX_ROOM_PLAYERS,
    // Player ids authenticate players: never send them.
    standings: standings.map(({ id, ...standing }) => ({ ...standing, me: id === me?.id })),
    rematch: state.rematch,
    me: me && {
      name: me.player.name,
      rounds: room.hardcore
        ? room.rounds.map((round) => ({ artists: round.artistOptions, clipStart: round.clipStart }))
        : room.rounds.map((round) => ({ options: round.options })),
      answers: myAnswers.map((a) => ({
        choice: a.choice,
        answerIndex: a.answerIndex,
        correct: a.correct,
        points: answerPoints(a),
        hardcore: a.hardcore
          ? {
              artistChoice: a.hardcore.artist.choice,
              artistAnswerIndex: a.hardcore.artist.answerIndex,
              songs: a.hardcore.songs,
            }
          : null,
        elapsedMs: a.elapsedMs,
        answer: a.answer,
      })),
      openStep:
        pendingArtist?.correct && openRound
          ? {
              artistChoice: pendingArtist.choice,
              artistAnswerIndex: pendingArtist.answerIndex,
              songs: openRound.songOptions,
            }
          : null,
    },
  };
}

export function parseRoundIndex(param: string, room: Room): number | null {
  const index = /^\d+$/.test(param) ? Number(param) : -1;
  return index >= 0 && index < room.roundCount ? index : null;
}

export interface PlayerRound {
  room: Room;
  index: number;
  playerId: string;
  /** Time spent on the round so far, measured on the server. */
  elapsedMs: number;
}

/**
 * The round a guess is for, checked against the player's progress: rounds
 * are answered once and in order.
 */
export async function findPlayerRound(
  params: { code: string; index: string },
  answeredAt: number,
): Promise<Result<PlayerRound>> {
  const found = await findRoom(params.code);
  if (!found.ok) return found;
  const room = found.value;
  const index = parseRoundIndex(params.index, room);
  if (index === null) return { ok: false, response: jsonError(404, "Rodada não encontrada.") };
  const player = await requirePlayer(room);
  if (!player.ok) return player;

  const { id, player: stored } = player.value;
  const [answers, audioStartedAt] = await Promise.all([
    getPlayerAnswers(room, id),
    getRoundStart(room, id, index),
  ]);
  if (index < answers.length) return { ok: false, response: jsonError(409, "Você já respondeu esta rodada.") };
  if (index > answers.length) {
    return { ok: false, response: jsonError(403, "Responda as rodadas anteriores primeiro.") };
  }

  const elapsedMs = roundElapsedMs({
    answeredAt,
    audioStartedAt,
    previousAnsweredAt: answers.at(-1)?.answeredAt ?? null,
    joinedAt: stored.joinedAt,
  });
  return { ok: true, value: { room, index, playerId: id, elapsedMs } };
}
