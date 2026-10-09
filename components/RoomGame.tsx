"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { api, ApiRequestError } from "@/lib/api/client";
import type { RoomResponse, RoomStanding } from "@/lib/api/types";
import { clipSeconds, HARD_CLIP_SECONDS, NORMAL_CLIP_SECONDS } from "@/lib/game/config";
import { formatDuration, MAX_NICKNAME_LENGTH } from "@/lib/game/room";
import { roomInviteText, roomShareText } from "@/lib/game/share";
import { loadNickname, saveNickname } from "@/lib/storage/nickname";

import { AnswerCard } from "./AnswerCard";
import { BackLink } from "./BackLink";
import { Cassette } from "./Cassette";
import { RoomRules } from "./RoomRules";
import { RoundPanel } from "./RoundPanel";
import { ShareButton } from "./ShareButton";
import { card, inkButton, paperLabel, primaryButton, secondaryButton, textInput } from "./styles";

/** How often the standings refresh while nobody is playing a round. */
const POLL_MS = 15_000;

interface RoomGameProps {
  code: string;
  /** Cassette color by category slug. */
  colors: Record<string, string>;
}

export function RoomGame({ code, colors }: RoomGameProps) {
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  // Round the player is looking at after answering it; null = next unanswered.
  const [viewing, setViewing] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      setRoom(await api.room(code));
      setError(null);
    } catch (e) {
      setError({
        status: e instanceof ApiRequestError ? e.status : 0,
        message: e instanceof Error ? e.message : "Algo deu errado.",
      });
    }
  }, [code]);

  useEffect(() => {
    let cancelled = false;
    api.room(code).then(
      (data) => !cancelled && setRoom(data),
      (e: Error) =>
        !cancelled &&
        setError({ status: e instanceof ApiRequestError ? e.status : 0, message: e.message }),
    );
    return () => {
      cancelled = true;
    };
  }, [code]);

  const me = room?.me ?? null;
  const playing = room !== null && me !== null && (viewing !== null || me.answers.length < room.roundCount);

  // Keep the standings fresh, except during a round.
  useEffect(() => {
    if (playing) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [playing, refresh]);

  if (error && (!room || error.status === 404)) {
    return (
      <div className={`${card} flex flex-col items-center gap-4 text-center`}>
        <p className="font-semibold">{error.message}</p>
        {error.status === 404 ? (
          <Link href="/multiplayer" className={primaryButton}>
            Criar uma sala nova
          </Link>
        ) : (
          <button type="button" className={primaryButton} onClick={() => void refresh()}>
            Tentar de novo
          </button>
        )}
      </div>
    );
  }
  if (!room) {
    return <p className="eyebrow py-16 text-center text-muted">Rebobinando a fita…</p>;
  }

  const color = colors[room.category.slug] ?? colors[Object.keys(colors)[0]] ?? "#d9cba8";

  return (
    <div className="flex flex-col gap-6">
      <RoomHeading room={room} color={color} />
      {!me ? (
        <JoinView room={room} onJoined={refresh} />
      ) : playing ? (
        <PlayView
          room={room}
          me={me}
          color={color}
          viewing={viewing}
          onGuessed={async (index) => {
            await refresh();
            setViewing(index);
          }}
          onNext={() => setViewing(null)}
        />
      ) : (
        <ResultView room={room} me={me} color={color} />
      )}
    </div>
  );
}

function RoomHeading({ room, color }: { room: RoomResponse; color: string }) {
  return (
    <div className="flex flex-col gap-2">
      <BackLink href="/multiplayer" label="Multiplayer" />
      <p className="eyebrow flex items-center gap-2 text-accent">
        <span aria-hidden className="h-3 w-3 rounded-full border-2 border-ink" style={{ background: color }} />
        Sala {room.code}
      </p>
      <h1 className="text-[32px] leading-none font-black tracking-[-0.02em]">{room.category.name}</h1>
      <p className="text-sm font-semibold text-muted">
        {room.roundCount} músicas · {room.hardMode ? `modo difícil (${HARD_CLIP_SECONDS}s)` : `modo normal (${NORMAL_CLIP_SECONDS}s)`}{" "}
        · expira em {expiresIn(room.expiresAt)}
      </p>
    </div>
  );
}

function expiresIn(expiresAt: number): string {
  const hours = Math.max(0, Math.round((expiresAt - Date.now()) / 3_600_000));
  if (hours >= 24) {
    const days = Math.round(hours / 24);
    return `${days} ${days === 1 ? "dia" : "dias"}`;
  }
  return hours <= 1 ? "menos de 1 hora" : `${hours} horas`;
}

function roomUrl(code: string): string {
  return typeof window === "undefined" ? `/sala/${code}` : `${window.location.origin}/sala/${code}`;
}

function InviteBox({ room }: { room: RoomResponse }) {
  return (
    <section className={`${card} flex flex-col gap-3`}>
      <h2 className="eyebrow text-accent">Chame a turma</h2>
      <p className="text-center font-mono text-3xl font-bold tracking-[0.25em]">{room.code}</p>
      <ShareButton
        text={roomInviteText(room.category.name, room.roundCount, roomUrl(room.code))}
        label="Convidar para a sala"
      />
    </section>
  );
}

function JoinView({ room, onJoined }: { room: RoomResponse; onJoined: () => Promise<void> }) {
  // Only rendered after the room loads in the browser, so storage is available.
  const [name, setName] = useState(loadNickname);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const full = room.standings.length >= room.maxPlayers;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api.joinRoom(room.code, name);
      saveNickname(name.trim());
      await onJoined();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
      setPending(false);
    }
  }

  return (
    <>
      {full ? (
        <p className={`${card} text-center font-semibold`}>
          Sala cheia: já tem {room.maxPlayers} jogadores. Que tal criar outra?
        </p>
      ) : (
        <form onSubmit={submit} className={`${card} flex flex-col gap-4`}>
          <h2 className="eyebrow text-accent">Entrar na sala</h2>
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
          <button type="submit" disabled={pending || !name.trim()} className={primaryButton}>
            {pending ? "Entrando…" : "Entrar e jogar"}
          </button>
          {error && (
            <p role="alert" className="text-center text-sm font-semibold text-tape-red">
              {error}
            </p>
          )}
        </form>
      )}
      <Standings room={room} />
      <RoomRules />
    </>
  );
}

interface PlayViewProps {
  room: RoomResponse;
  me: NonNullable<RoomResponse["me"]>;
  color: string;
  viewing: number | null;
  onGuessed: (index: number) => Promise<void>;
  onNext: () => void;
}

function PlayView({ room, me, color, viewing, onGuessed, onNext }: PlayViewProps) {
  const index = viewing ?? me.answers.length;
  const record = me.answers[index] ?? null;
  const last = index === room.roundCount - 1;

  async function guess(choice: number) {
    await api.roomGuess(room.code, index, choice);
    await onGuessed(index);
  }

  return (
    <>
      {me.answers.length === 0 && <InviteBox room={room} />}
      <RoundDots room={room} me={me} current={index} />
      <RoundPanel
        key={index}
        heading={`Música ${index + 1} de ${room.roundCount} · ${me.name}`}
        color={color}
        options={me.rounds[index].options}
        audioSrc={api.roomAudioUrl(room.code, index)}
        clipSeconds={clipSeconds(room.hardMode)}
        preload={false}
        result={record}
        onGuess={guess}
        after={
          <button type="button" className={primaryButton} onClick={onNext}>
            {last ? "Ver placar" : "Próxima música"}
          </button>
        }
      />
    </>
  );
}

function RoundDots({
  room,
  me,
  current,
}: {
  room: RoomResponse;
  me: NonNullable<RoomResponse["me"]>;
  current: number;
}) {
  return (
    <ol className="flex gap-1.5" aria-label="Progresso na sala">
      {Array.from({ length: room.roundCount }, (_, i) => {
        const round = me.answers[i];
        return (
          <li
            key={i}
            aria-label={`Música ${i + 1}: ${round ? (round.correct ? "acertou" : "errou") : "não jogada"}`}
            className={`h-3 flex-1 rounded-full border-2 ${
              round
                ? round.correct
                  ? "border-ink bg-tape-green"
                  : "border-ink bg-tape-red"
                : i === current
                  ? "border-ink bg-tape-yellow"
                  : "border-surface-line bg-surface"
            }`}
          />
        );
      })}
    </ol>
  );
}

function ResultView({ room, me, color }: { room: RoomResponse; me: NonNullable<RoomResponse["me"]>; color: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mine = room.standings.find((s) => s.me);
  const finishedCount = room.standings.filter((s) => s.finished).length;
  const totalMs = me.answers.reduce((sum, a) => sum + a.elapsedMs, 0);
  const score = me.answers.filter((a) => a.correct).length;

  const text = roomShareText({
    categoryName: room.category.name,
    results: me.answers.map((a) => a.correct),
    hardMode: room.hardMode,
    totalMs,
    position: mine?.position ? { place: mine.position, of: finishedCount } : null,
    url: roomUrl(room.code),
  });

  async function rematch() {
    setPending(true);
    setError(null);
    try {
      const { code } = await api.rematch(room.code);
      router.push(`/sala/${code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
      setPending(false);
    }
  }

  return (
    <>
      <Cassette color={color}>
        <div className={`${paperLabel} flex flex-col items-center gap-2 px-3.5 pt-3 pb-4 text-center`}>
          <p className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
            {mine?.position ? `${mine.position}º lugar de ${finishedCount}` : "Seu resultado"}
          </p>
          <p className="font-marker text-6xl leading-none tabular-nums">
            {score}/{room.roundCount}
          </p>
          <p className="font-mono text-sm font-bold">{formatDuration(totalMs)}</p>
          <div className="flex flex-wrap justify-center gap-1.5" aria-hidden>
            {me.answers.map((a, i) => (
              <span
                key={i}
                className={`h-6 w-6 rounded-md border-2 border-ink ${a.correct ? "bg-tape-green" : "bg-tape-red"}`}
              />
            ))}
          </div>
        </div>
      </Cassette>

      <ShareButton text={text} />
      <Standings room={room} />

      <div className="flex flex-col gap-2">
        <button type="button" disabled={pending} className={inkButton} onClick={() => void rematch()}>
          {pending ? "Preparando…" : room.rematch ? "Entrar na revanche" : "Revanche"}
        </button>
        <p className="text-center text-xs text-muted">Mesma categoria e modo, músicas novas.</p>
        {error && (
          <p role="alert" className="text-center text-sm font-semibold text-tape-red">
            {error}
          </p>
        )}
      </div>

      <InviteBox room={room} />

      <section className="flex flex-col gap-3">
        <h2 className="eyebrow text-accent">Lado A</h2>
        <ol className={`${card} flex flex-col gap-3`}>
          {me.answers.map((round, i) => (
            <li key={i} className="flex items-center gap-3">
              <span
                aria-label={round.correct ? "Acertou" : "Errou"}
                className={`h-3 w-3 shrink-0 rounded-full border-2 border-ink ${
                  round.correct ? "bg-tape-green" : "bg-tape-red"
                }`}
              />
              <div className="min-w-0 flex-1">
                <AnswerCard answer={round.answer} compact />
              </div>
              <span className="shrink-0 font-mono text-xs text-muted tabular-nums">
                {formatDuration(round.elapsedMs)}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <Link href="/multiplayer" className={secondaryButton}>
        Criar outra sala
      </Link>
    </>
  );
}

function Standings({ room }: { room: RoomResponse }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="eyebrow flex justify-between text-accent">
        Placar
        <span className="text-muted">
          {room.standings.length}/{room.maxPlayers} jogadores
        </span>
      </h2>
      {room.standings.length === 0 ? (
        <p className={`${card} text-center text-sm text-muted`}>Ninguém jogou ainda.</p>
      ) : (
        <ol className="flex flex-col divide-y-2 divide-line rounded-2xl border-2 border-line bg-surface/40">
          {room.standings.map((s, i) => (
            <StandingRow key={i} standing={s} roundCount={room.roundCount} />
          ))}
        </ol>
      )}
    </section>
  );
}

function StandingRow({ standing: s, roundCount }: { standing: RoomStanding; roundCount: number }) {
  return (
    <li className={`flex items-center gap-3 px-4 py-3 ${s.me ? "font-extrabold" : ""}`}>
      <span className="w-7 shrink-0 font-mono text-sm font-bold tabular-nums">
        {s.position ? `${s.position}º` : "–"}
      </span>
      <span className="min-w-0 flex-1 truncate">
        {s.name}
        {s.me && <span className="ml-1.5 text-xs font-semibold text-muted">(você)</span>}
      </span>
      {s.finished ? (
        <span className="shrink-0 text-right font-mono text-sm tabular-nums">
          {s.correct}/{roundCount}
          <span className="ml-2 text-xs text-muted">{formatDuration(s.totalMs)}</span>
        </span>
      ) : (
        <span className="shrink-0 font-mono text-xs text-muted">
          jogando ({s.answered}/{roundCount})
        </span>
      )}
    </li>
  );
}
