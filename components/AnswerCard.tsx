import Image from "next/image";

import type { RevealedAnswer } from "@/lib/api/types";

export function AnswerCard({ answer, compact = false }: { answer: RevealedAnswer; compact?: boolean }) {
  const size = compact ? 48 : 80;
  return (
    <div className="flex items-center gap-3">
      {answer.cover ? (
        <Image
          src={answer.cover}
          alt={answer.album ? `Capa de ${answer.album}` : ""}
          width={size}
          height={size}
          unoptimized
          className="shrink-0 rounded-lg"
        />
      ) : (
        <div style={{ width: size, height: size }} className="shrink-0 rounded-lg bg-stone-200 dark:bg-stone-800" />
      )}
      <div className="min-w-0">
        <p className={`truncate font-semibold ${compact ? "text-sm" : "text-lg"}`}>{answer.title}</p>
        <p className="truncate text-sm text-stone-600 dark:text-stone-400">{answer.artist}</p>
        {!compact && answer.album && (
          <p className="truncate text-sm text-stone-500 dark:text-stone-500">{answer.album}</p>
        )}
        {!compact && answer.link && (
          <a
            href={answer.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            Ouvir no Deezer ↗
          </a>
        )}
      </div>
    </div>
  );
}
