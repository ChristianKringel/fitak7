import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Infinite-mode round tokens. They carry the answer, so they are encrypted
// (AES-256-GCM), not just signed: a signed token would be readable base64.

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;
// Binds ciphertexts to this purpose and format version.
const AAD = Buffer.from("musicle-round:v1");

/** How long a round token can be used for audio and guesses. */
export const ROUND_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export interface RoundPayload {
  category: string;
  songId: string;
  trackId: number;
  answerIndex: number;
  /** Issue time, ms since epoch. */
  issuedAt: number;
}

// Short keys keep tokens small; the client sends many of them back.
interface WirePayload {
  c: string;
  s: string;
  t: number;
  a: number;
  i: number;
}

export function parseRoundKey(secret: string | undefined): Buffer {
  if (!secret) throw new Error("ROUND_SECRET is not set. Run `pnpm env:setup` and restart the server.");
  const key = Buffer.from(secret, "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error(`ROUND_SECRET must be ${KEY_BYTES} bytes, base64-encoded`);
  }
  return key;
}

let cachedKey: Buffer | undefined;
export function getRoundKey(): Buffer {
  cachedKey ??= parseRoundKey(process.env.ROUND_SECRET);
  return cachedKey;
}

export function sealRound(payload: RoundPayload, key: Buffer): string {
  const wire: WirePayload = {
    c: payload.category,
    s: payload.songId,
    t: payload.trackId,
    a: payload.answerIndex,
    i: payload.issuedAt,
  };
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(AAD);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(wire), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, ciphertext, cipher.getAuthTag()]).toString("base64url");
}

function isWirePayload(value: unknown): value is WirePayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.c === "string" &&
    typeof v.s === "string" &&
    Number.isInteger(v.t) &&
    Number.isInteger(v.a) &&
    Number.isInteger(v.i)
  );
}

/**
 * Decrypts a token. Returns null if it is malformed, tampered with,
 * encrypted with another key or older than `maxAgeMs`.
 */
export function openRound(
  token: string,
  key: Buffer,
  options: { now: number; maxAgeMs?: number },
): RoundPayload | null {
  const raw = Buffer.from(token, "base64url");
  if (raw.length <= IV_BYTES + TAG_BYTES) return null;
  const iv = raw.subarray(0, IV_BYTES);
  const tag = raw.subarray(raw.length - TAG_BYTES);
  const ciphertext = raw.subarray(IV_BYTES, raw.length - TAG_BYTES);

  let wire: unknown;
  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(AAD);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    wire = JSON.parse(plain.toString("utf8"));
  } catch {
    return null;
  }
  if (!isWirePayload(wire)) return null;

  const maxAgeMs = options.maxAgeMs ?? ROUND_TOKEN_TTL_MS;
  const age = options.now - wire.i;
  if (age > maxAgeMs || age < -60_000) return null;

  return {
    category: wire.c,
    songId: wire.s,
    trackId: wire.t,
    answerIndex: wire.a,
    issuedAt: wire.i,
  };
}
