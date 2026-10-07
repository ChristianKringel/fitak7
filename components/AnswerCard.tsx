import Image from "next/image";

import type { RevealedAnswer } from "@/lib/api/types";

/** Song details. Inherits the text color, so it works on paper and on the page. */
export function AnswerCard({ answer, compact = false }: { answer: RevealedAnswer; compact?: boolean }) {
  const size = compact ? 44 : 76;
  return (
    <div className="flex min-w-0 items-center gap-3">
      {answer.cover ? (
        <Image
          src={answer.cover}
          alt={answer.album ? `Capa de ${answer.album}` : ""}
          width={size}
          height={size}
          unoptimized
          className="shrink-0 rounded-md border-2 border-ink"
        />
      ) : (
        <div style={{ width: size, height: size }} className="shrink-0 rounded-md border-2 border-ink bg-reel" />
      )}
      <div className="min-w-0">
        <p className={`truncate font-extrabold ${compact ? "text-sm" : "text-lg leading-tight"}`}>{answer.title}</p>
        <p className="truncate text-sm opacity-75">{answer.artist}</p>
        {!compact && answer.album && <p className="truncate text-sm opacity-60">{answer.album}</p>}
        {!compact && answer.link && (
          <a
            href={answer.link}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs font-bold tracking-[0.06em] uppercase underline underline-offset-2"
          >
            Ouvir no Deezer ↗
          </a>
        )}
      </div>
    </div>
  );
}
