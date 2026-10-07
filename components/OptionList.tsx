"use client";

import type { RoundOption } from "@/lib/api/types";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

interface OptionListProps {
  options: RoundOption[];
  /** Set after the guess: highlights the right and the chosen option. */
  reveal: { choice: number; answerIndex: number } | null;
  disabled: boolean;
  pendingChoice: number | null;
  onChoose: (choice: number) => void;
}

export function OptionList({ options, reveal, disabled, pendingChoice, onChoose }: OptionListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {options.map((option, index) => {
        let tone = "bg-paper text-ink shadow-[0_4px_0_var(--key-shadow)] hover:bg-white";
        let tag = "bg-ink text-paper";
        let mark = "";
        if (reveal) {
          if (index === reveal.answerIndex) {
            tone = "bg-tape-green text-ink shadow-[0_4px_0_var(--key-shadow)]";
            mark = "✓";
          } else if (index === reveal.choice) {
            tone = "bg-tape-red text-ink shadow-[0_4px_0_var(--key-shadow)]";
            mark = "✗";
          } else {
            tone = "bg-paper text-ink opacity-45 shadow-none";
          }
        } else if (pendingChoice === index) {
          tone = "bg-tape-yellow text-ink translate-y-1 shadow-none";
          tag = "bg-ink text-tape-yellow";
        }
        return (
          <li key={index}>
            <button
              type="button"
              disabled={disabled || reveal !== null}
              onClick={() => onChoose(index)}
              className={`key flex min-h-14 w-full items-center gap-3 rounded-xl border-2 border-ink px-3 py-2.5 text-left text-base font-bold disabled:cursor-default ${tone}`}
            >
              <span
                aria-hidden
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-md font-mono text-xs font-bold ${tag}`}
              >
                {LETTERS[index]}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span>{option.title}</span>
                <span className="text-xs font-medium opacity-70">{option.artist}</span>
              </span>
              {mark && (
                <span aria-hidden className="text-xl font-black">
                  {mark}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
