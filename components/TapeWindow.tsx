import type { ReactNode } from "react";

function Reel({ tape, spinning }: { tape: number; spinning: boolean }) {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden className="shrink-0">
      {/* Wound tape: its radius shows how much tape is on this reel. */}
      <circle cx="15" cy="15" r={tape} fill="#5B4A36" />
      <g className={spinning ? "reel-spin" : undefined}>
        <circle cx="15" cy="15" r="7" fill="#F4EAD5" />
        <circle cx="15" cy="15" r="2.5" fill="#14120E" />
        <path
          d="M15 8.5v2.5M15 19v2.5M8.5 15H11M19 15h2.5"
          stroke="#14120E"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

interface TapeWindowProps {
  children?: ReactNode;
  /** 0 = all tape on the left reel, 1 = all on the right. */
  progress?: number;
  spinning?: boolean;
  className?: string;
}

/** The dark window of a cassette, with its two reels. */
export function TapeWindow({ children, progress = 0, spinning = false, className = "" }: TapeWindowProps) {
  const left = 13 - 4 * progress;
  const right = 9 + 4 * progress;
  return (
    <div
      className={`flex h-11 items-center justify-between gap-2 rounded-full bg-ink px-2 text-[#f4ead5] ${className}`}
    >
      <Reel tape={left} spinning={spinning} />
      <span className="min-w-0 truncate font-mono text-xs font-medium">{children}</span>
      <Reel tape={right} spinning={spinning} />
    </div>
  );
}
