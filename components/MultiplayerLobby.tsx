"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { api } from "@/lib/api/client";
import { HARD_CLIP_SECONDS, NORMAL_CLIP_SECONDS } from "@/lib/game/config";
import {
  DEFAULT_ROOM_ROUNDS,
  MAX_NICKNAME_LENGTH,
  MAX_ROOM_ROUNDS,
  MIN_ROOM_ROUNDS,
  parseRoomCode,
  ROOM_CODE_LENGTH,
} from "@/lib/game/room";
import { saveNickname, useSavedNickname } from "@/lib/storage/nickname";

import { card, inkButton, primaryButton, textInput } from "./styles";

export interface LobbyCategory {
  slug: string;
  name: string;
  color: string;
}

export function MultiplayerLobby({ categories }: { categories: LobbyCategory[] }) {
  return (
    <div className="flex flex-col gap-6">
      <CreateRoomForm categories={categories} />
      <JoinRoomForm />
    </div>
  );
}

function CreateRoomForm({ categories }: { categories: LobbyCategory[] }) {
  const router = useRouter();
  const [category, setCategory] = useState(categories[0]?.slug ?? "");
  const [roundCount, setRoundCount] = useState(DEFAULT_ROOM_ROUNDS);
  const [hard, setHardMode] = useState(false);
  const savedName = useSavedNickname();
  // null until the player types: shows the saved nickname.
  const [typedName, setName] = useState<string | null>(null);
  const name = typedName ?? savedName;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);


  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const { code } = await api.createRoom({ category, roundCount, hardMode: hard, name });
      saveNickname(name.trim());
      router.push(`/sala/${code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className={`${card} flex flex-col gap-5`}>
      <h2 className="eyebrow text-accent">Criar sala</h2>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-bold">Categoria</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <label
              key={c.slug}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 px-3.5 text-sm font-bold has-[:focus-visible]:outline-2 ${
                category === c.slug ? "border-ink bg-tape-yellow text-ink" : "border-surface-line bg-surface text-fg"
              }`}
            >
              <input
                type="radio"
                name="category"
                value={c.slug}
                checked={category === c.slug}
                onChange={() => setCategory(c.slug)}
                className="sr-only"
              />
              <span aria-hidden className="h-3 w-3 rounded-full border-2 border-ink" style={{ background: c.color }} />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="flex items-baseline justify-between text-sm font-bold">
          Rodadas
          <span className="font-mono text-2xl font-bold tabular-nums">{roundCount}</span>
        </span>
        <input
          type="range"
          min={MIN_ROOM_ROUNDS}
          max={MAX_ROOM_ROUNDS}
          step={1}
          value={roundCount}
          onChange={(e) => setRoundCount(Number(e.target.value))}
          className="h-11 w-full accent-tape-red"
        />
        <span className="flex justify-between font-mono text-[11px] text-muted">
          <span>{MIN_ROOM_ROUNDS}</span>
          <span>{MAX_ROOM_ROUNDS}</span>
        </span>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-bold">Modo</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: false, label: "Normal", detail: `Trechos de ${NORMAL_CLIP_SECONDS}s` },
            { value: true, label: "Difícil", detail: `Trechos de ${HARD_CLIP_SECONDS}s` },
          ].map((mode) => (
            <label
              key={mode.label}
              className={`flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-xl border-2 px-2 text-center has-[:focus-visible]:outline-2 ${
                hard === mode.value
                  ? mode.value
                    ? "border-ink bg-tape-red text-ink"
                    : "border-ink bg-tape-green text-ink"
                  : "border-surface-line bg-surface text-fg"
              }`}
            >
              <input
                type="radio"
                name="mode"
                checked={hard === mode.value}
                onChange={() => setHardMode(mode.value)}
                className="sr-only"
              />
              <span className="text-[15px] font-extrabold">{mode.label}</span>
              <span className="text-xs font-semibold opacity-80">{mode.detail}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-bold">Seu apelido</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_NICKNAME_LENGTH}
          autoComplete="nickname"
          placeholder="Como vão te ver no placar"
          className={textInput}
        />
      </label>

      <button type="submit" disabled={pending || !category || !name.trim()} className={primaryButton}>
        {pending ? "Criando…" : "Criar sala"}
      </button>
      {error && (
        <p role="alert" className="text-center text-sm font-semibold text-tape-red">
          {error}
        </p>
      )}
    </form>
  );
}

function JoinRoomForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseRoomCode(code);
    if (!parsed) {
      setError(`O código tem ${ROOM_CODE_LENGTH} letras e números.`);
      return;
    }
    router.push(`/sala/${parsed}`);
  }

  return (
    <form onSubmit={submit} className={`${card} flex flex-col gap-4`}>
      <h2 className="eyebrow text-accent">Entrar numa sala</h2>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-bold">Código da sala</span>
        <input
          required
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          maxLength={ROOM_CODE_LENGTH + 2}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="Ex.: 4F9QKD"
          className={`${textInput} font-mono tracking-[0.2em] uppercase`}
        />
      </label>
      <button type="submit" disabled={!code.trim()} className={inkButton}>
        Entrar
      </button>
      {error && (
        <p role="alert" className="text-center text-sm font-semibold text-tape-red">
          {error}
        </p>
      )}
    </form>
  );
}
