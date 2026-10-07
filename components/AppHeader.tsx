import Link from "next/link";

import { APP_NAME } from "@/lib/game/config";

import { CassetteLogo } from "./CassetteLogo";
import { HardModeToggle } from "./HardModeToggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur">
      {/* Green, red and yellow: the colors of the Rio Grande do Sul flag. */}
      <div aria-hidden className="grid h-1.5 grid-cols-3">
        <span className="bg-tape-green" />
        <span className="bg-tape-red" />
        <span className="bg-tape-yellow" />
      </div>
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-md items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 text-fg">
            <CassetteLogo />
            <span className="font-display text-lg tracking-[0.02em] uppercase">{APP_NAME}</span>
          </Link>
          <HardModeToggle />
        </div>
      </div>
    </header>
  );
}
