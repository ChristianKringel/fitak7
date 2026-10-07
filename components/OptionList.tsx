"use client";

interface OptionListProps {
  options: string[];
  /** Set after the guess: highlights the right and the chosen option. */
  reveal: { choice: number; answerIndex: number } | null;
  disabled: boolean;
  pendingChoice: number | null;
  onChoose: (choice: number) => void;
}

export function OptionList({ options, reveal, disabled, pendingChoice, onChoose }: OptionListProps) {
  return (
    <ul className="flex flex-col gap-2.5">
      {options.map((title, index) => {
        let tone =
          "border-stone-300 bg-white hover:border-emerald-600 hover:bg-emerald-50 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-emerald-500 dark:hover:bg-emerald-950";
        let mark = "";
        if (reveal) {
          if (index === reveal.answerIndex) {
            tone = "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-600";
            mark = "✓";
          } else if (index === reveal.choice) {
            tone = "border-red-600 bg-red-600 text-white";
            mark = "✗";
          } else {
            tone = "border-stone-200 bg-white text-stone-400 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-500";
          }
        } else if (pendingChoice === index) {
          tone = "border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950";
        }
        return (
          <li key={index}>
            <button
              type="button"
              disabled={disabled || reveal !== null}
              onClick={() => onChoose(index)}
              className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left text-base font-medium transition-colors disabled:cursor-default ${tone}`}
            >
              <span>{title}</span>
              {mark && <span aria-hidden className="text-lg font-bold">{mark}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
