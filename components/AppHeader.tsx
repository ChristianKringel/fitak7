import Link from "next/link";

import { APP_NAME } from "@/lib/game/config";

import { HardModeToggle } from "./HardModeToggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
      {/* Green, red and yellow: the colors of the Rio Grande do Sul flag. */}
      <div aria-hidden className="flex h-1">
        <span className="flex-1 bg-emerald-700" />
        <span className="flex-1 bg-red-600" />
        <span className="flex-1 bg-yellow-400" />
      </div>
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          {APP_NAME}
        </Link>
        <HardModeToggle />
      </div>
    </header>
  );
}
