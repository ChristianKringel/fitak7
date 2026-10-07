"use client";

import { useEffect, useState, type ReactNode } from "react";

import type { RevealedAnswer } from "@/lib/api/types";
import { useClipPlayer } from "@/lib/audio/use-clip-player";

import { AnswerCard } from "./AnswerCard";
import { OptionList } from "./OptionList";
import { PlayButton } from "./PlayButton";

export interface RoundResult {
  choice: number;
  answerIndex: number;
  correct: boolean;
  answer: RevealedAnswer;
}

interface RoundPanelProps {
  heading: ReactNode;
  options: string[];
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
  const { heading, options, audioSrc, clipSeconds, result, onGuess, after, onAudioError } = props;
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

  return (
    <section className="flex flex-col gap-6">
      <div className="text-center text-sm font-medium text-stone-600 dark:text-stone-400">{heading}</div>

      {result ? (
        <div className="flex flex-col gap-4">
          <p
            className={`text-center text-2xl font-bold ${
              result.correct ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}
            role="status"
          >
            {result.correct ? "Acertou!" : "Errou!"}
          </p>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
            <AnswerCard answer={result.answer} />
          </div>
          {after}
          <PlayButton player={player} src={audioSrc} seconds={null} variant="inline" />
        </div>
      ) : (
        <div className="flex justify-center py-2">
          <PlayButton player={player} src={audioSrc} seconds={clipSeconds} />
        </div>
      )}

      {player.status === "error" && !result && onAudioError}

      <div className="flex flex-col gap-2">
        {!result && <p className="text-center text-sm text-stone-600 dark:text-stone-400">Qual é a música?</p>}
        <OptionList
          options={options}
          reveal={result}
          disabled={pending !== null}
          pendingChoice={pending}
          onChoose={choose}
        />
        {error && (
          <p role="alert" className="text-center text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

    </section>
  );
}
