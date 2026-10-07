import type { ReactNode } from "react";

interface CassetteProps {
  /** Body color (see tape.ts). */
  color: string;
  children: ReactNode;
  className?: string;
}

/** Cassette body: colored shell with screws and a solid drop shadow. */
export function Cassette({ color, children, className = "" }: CassetteProps) {
  return (
    <div
      className={`relative flex flex-col gap-3.5 rounded-[18px] border-2 border-ink p-3.5 shadow-[0_6px_0_var(--key-shadow)] ${className}`}
      style={{ background: color }}
    >
      <span aria-hidden className="absolute top-[7px] left-[7px] h-1.5 w-1.5 rounded-full bg-ink/55" />
      <span aria-hidden className="absolute top-[7px] right-[7px] h-1.5 w-1.5 rounded-full bg-ink/55" />
      {children}
    </div>
  );
}
