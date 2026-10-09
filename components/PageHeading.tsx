import { BackLink } from "./BackLink";
import { tapeNumber } from "./tape";

interface PageHeadingProps {
  mode: string;
  title: string;
  /** Position of the category in the catalog. */
  index: number;
  color: string;
}

export function PageHeading({ mode, title, index, color }: PageHeadingProps) {
  return (
    <div className="flex flex-col gap-2">
      <BackLink />
      <p className="eyebrow flex items-center gap-2 text-accent">
        <span aria-hidden className="h-3 w-3 rounded-full border-2 border-ink" style={{ background: color }} />
        K7 {tapeNumber(index)} · {mode}
      </p>
      <h1 className="text-[32px] leading-none font-black tracking-[-0.02em]">{title}</h1>
    </div>
  );
}
