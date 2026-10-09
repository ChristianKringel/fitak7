import "server-only";

import { randomBytes } from "node:crypto";

import { Redis } from "@upstash/redis";

import type { RevealedAnswer } from "@/lib/api/types";
import { generateRoomCode, MAX_ROOM_PLAYERS, nicknameKey, type Room } from "@/lib/game/room";

// Multiplayer rooms in Upstash Redis. Every key of a room expires with it
// (ROOM_TTL_MS after creation), so nothing needs cleaning up.
//
//   room:{code}            Room (JSON)
//   room:{code}:players    player id → StoredPlayer
//   room:{code}:names      nickname key → player id (unique nicknames)
//   room:{code}:starts     "{player id}:{round}" → first audio request (ms)
//   room:{code}:answers    "{player id}:{round}" → StoredAnswer
//   room:{code}:rematch    code of the rematch room
//
// Player ids are secrets (they authenticate the player through a cookie)
// and never leave the server except in that cookie.

export interface StoredPlayer {
  name: string;
  joinedAt: number;
}

export interface StoredAnswer {
  choice: number;
  answerIndex: number;
  correct: boolean;
  answeredAt: number;
  elapsedMs: number;
  answer: RevealedAnswer;
}

let client: Redis | undefined;
function redis(): Redis {
  // Reads KV_REST_API_URL / KV_REST_API_TOKEN (Vercel Marketplace names).
  client ??= Redis.fromEnv();
  return client;
}

const keys = (code: string) => ({
  room: `room:${code}`,
  players: `room:${code}:players`,
  names: `room:${code}:names`,
  starts: `room:${code}:starts`,
  answers: `room:${code}:answers`,
  rematch: `room:${code}:rematch`,
});

const roundField = (playerId: string, index: number) => `${playerId}:${index}`;

export function newPlayerId(): string {
  return randomBytes(18).toString("base64url");
}

/** Stores a new room under a fresh random code and returns the code. */
export async function createRoom(build: (code: string) => Room): Promise<Room> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const room = build(generateRoomCode(Math.random));
    const created = await redis().set(keys(room.code).room, room, { nx: true, pxat: room.expiresAt });
    if (created) return room;
  }
  throw new Error("Could not find a free room code");
}

export async function getRoom(code: string): Promise<Room | null> {
  return redis().get<Room>(keys(code).room);
}

export type JoinResult = "ok" | "taken" | "full";

// Atomic: the nickname check, the player limit and the insert can't race.
const JOIN_SCRIPT = `
if redis.call('HEXISTS', KEYS[1], ARGV[1]) == 1 then return 'ok' end
if redis.call('HEXISTS', KEYS[2], ARGV[2]) == 1 then return 'taken' end
if redis.call('HLEN', KEYS[1]) >= tonumber(ARGV[4]) then return 'full' end
redis.call('HSET', KEYS[2], ARGV[2], ARGV[1])
redis.call('HSET', KEYS[1], ARGV[1], ARGV[3])
redis.call('PEXPIREAT', KEYS[1], ARGV[5])
redis.call('PEXPIREAT', KEYS[2], ARGV[5])
return 'ok'
`;

export async function joinRoom(
  room: Room,
  playerId: string,
  player: StoredPlayer,
): Promise<JoinResult> {
  const k = keys(room.code);
  return redis().eval<string[], JoinResult>(
    JOIN_SCRIPT,
    [k.players, k.names],
    [
      playerId,
      nicknameKey(player.name),
      JSON.stringify(player),
      String(MAX_ROOM_PLAYERS),
      String(room.expiresAt),
    ],
  );
}

export async function getPlayer(code: string, playerId: string): Promise<StoredPlayer | null> {
  return redis().hget<StoredPlayer>(keys(code).players, playerId);
}

export interface RoomState {
  players: Map<string, StoredPlayer>;
  /** Player id → answers in round order, up to the first gap. */
  answers: Map<string, StoredAnswer[]>;
  rematch: string | null;
}

export async function getRoomState(room: Room): Promise<RoomState> {
  const k = keys(room.code);
  const [players, answers, rematch] = await redis()
    .pipeline()
    .hgetall<Record<string, StoredPlayer>>(k.players)
    .hgetall<Record<string, StoredAnswer>>(k.answers)
    .get<string>(k.rematch)
    .exec();

  const byPlayer = new Map<string, StoredAnswer[]>();
  for (const id of Object.keys(players ?? {})) {
    const list: StoredAnswer[] = [];
    for (let i = 0; i < room.roundCount; i++) {
      const answer = answers?.[roundField(id, i)];
      if (!answer) break;
      list.push(answer);
    }
    byPlayer.set(id, list);
  }
  return { players: new Map(Object.entries(players ?? {})), answers: byPlayer, rematch };
}

/** The player's answers in round order, up to the first unanswered round. */
export async function getPlayerAnswers(room: Room, playerId: string): Promise<StoredAnswer[]> {
  const fields = Array.from({ length: room.roundCount }, (_, i) => roundField(playerId, i));
  const found = await redis().hmget<Record<string, StoredAnswer | null>>(keys(room.code).answers, ...fields);
  const list: StoredAnswer[] = [];
  for (const field of fields) {
    const answer = found?.[field];
    if (!answer) break;
    list.push(answer);
  }
  return list;
}

/** Records the first audio request of a round; later requests keep the first time. */
export async function markRoundStart(room: Room, playerId: string, index: number, now: number) {
  const k = keys(room.code);
  await redis()
    .multi()
    .hsetnx(k.starts, roundField(playerId, index), now)
    .pexpireat(k.starts, room.expiresAt)
    .exec();
}

export async function getRoundStart(room: Room, playerId: string, index: number): Promise<number | null> {
  return redis().hget<number>(keys(room.code).starts, roundField(playerId, index));
}

/** Saves the answer unless the round was already answered; false in that case. */
export async function saveAnswer(
  room: Room,
  playerId: string,
  index: number,
  answer: StoredAnswer,
): Promise<boolean> {
  const k = keys(room.code);
  const [saved] = await redis()
    .multi()
    .hsetnx(k.answers, roundField(playerId, index), answer)
    .pexpireat(k.answers, room.expiresAt)
    .exec();
  return saved === 1;
}

/** Links a rematch room; returns the code that won if another one was linked first. */
export async function linkRematch(room: Room, rematchCode: string): Promise<string> {
  const k = keys(room.code);
  const linked = await redis().set(k.rematch, rematchCode, { nx: true, pxat: room.expiresAt });
  if (linked) return rematchCode;
  return (await redis().get<string>(k.rematch)) ?? rematchCode;
}

export async function getRematch(code: string): Promise<string | null> {
  return redis().get<string>(keys(code).rematch);
}
