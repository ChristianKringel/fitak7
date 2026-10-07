"use client";

import { useEffect, useState, type ReactNode } from "react";

import type { RevealedAnswer, RoundOption } from "@/lib/api/types";
import { useClipPlayer } from "@/lib/audio/use-clip-player";

import { AnswerCard } from "./AnswerCard";
import { Cassette } from "./Cassette";
import { OptionList } from "./OptionList";
import { PlayButton } from "./PlayButton";
import { paperLabel } from "./styles";
import { TapeWindow } from "./TapeWindow";

export interface RoundResult {
  choice: number;
  answerIndex: number;
  correct: boolean;
  answer: RevealedAnswer;
}

interface RoundPanelProps {
  heading: ReactNode;
  /** Cassette body color of the category. */
  color: string;
  options: RoundOption[];
  audioSrc: string;
  clipSeconds: number;
  result: RoundResult | null;
  /** Sends the guess; throws with a user-facing message on failure. */
  onGuess: (choice: number) => Promise<void>;
  /** Shown after the reveal (e.g. "Próxima"). */
  after: ReactNode;
  /** Shown when the audio fails (e.g. a skip button). */
  onAudioError?: ReactNode;
}

export function RoundPanel(props: RoundPanelProps) {
  const { heading, color, options, audioSrc, clipSeconds, result, onGuess, after, onAudioError } = props;
  const player = useClipPlayer();
  const { prepare, reset } = player;
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Start loading the clip as soon as the round shows up.
  useEffect(() => {
    prepare(audioSrc);
  }, [audioSrc, prepare]);

  async function choose(choice: number) {
    setPending(choice);
    setError(null);
    try {
      await onGuess(choice);
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado. Tente de novo.");
    } finally {
      setPending(null);
    }
  }

  const seconds = result ? null : clipSeconds;
  const total = player.limit ?? seconds ?? 30;
  const progress = Math.min(1, player.position / total);
  const playing = player.status === "playing";

  return (
    <section className="flex flex-col gap-6">
      <Cassette color={color}>
        <div className={`${paperLabel} flex flex-col gap-2 px-3.5 pt-3 pb-3.5`}>
          <p className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase">{heading}</p>
          {result ? (
            <>
              <p
                role="status"
                className={`border-b-[1.5px] border-paper-line pb-1 font-marker text-[30px] leading-[1.1] ${
                  result.correct ? "text-tape-green" : "text-stamp"
                }`}
              >
                {result.correct ? "Acertou!" : "Errou!"}
              </p>
              <AnswerCard answer={result.answer} />
            </>
          ) : (
            <p className="border-b-[1.5px] border-paper-line pb-1 font-marker text-[30px] leading-[1.1]">
              Qual é a música?
            </p>
          )}
          <TapeWindow className="mt-1" progress={progress} spinning={playing}>
            <span aria-live="polite">
              {player.status === "error"
                ? "Não foi possível tocar"
                : `${player.position.toFixed(1)}s / ${total}s`}
            </span>
          </TapeWindow>
        </div>
        <PlayButton player={player} src={audioSrc} seconds={seconds} />
      </Cassette>

      {player.status === "error" && !result && onAudioError}
      {result && after}

      <div className="flex flex-col gap-2">
        <OptionList
          options={options}
          reveal={result}
          disabled={pending !== null}
          pendingChoice={pending}
          onChoose={choose}
        />
        {error && (
          <p role="alert" className="text-center text-sm font-semibold text-tape-red">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
