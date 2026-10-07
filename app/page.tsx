import Link from "next/link";

import { TodayBadge } from "@/components/TodayBadge";
import { card } from "@/components/styles";
import { NORMAL_CLIP_SECONDS } from "@/lib/game/config";
import { OPTIONS_PER_ROUND } from "@/lib/game/options";
import { ROUNDS_PER_DAY } from "@/lib/game/schedule";
import { listCategories } from "@/lib/server/data";

export default async function Home() {
  const categories = await listCategories();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Qual é a música?</h1>
        <p className="text-stone-600 dark:text-stone-400">
          Ouça {NORMAL_CLIP_SECONDS} segundos e escolha entre {OPTIONS_PER_ROUND} opções. São{" "}
          {ROUNDS_PER_DAY} músicas por dia em cada categoria, iguais para todo mundo.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {categories.map((category) => {
          const playable = category.songCount >= OPTIONS_PER_ROUND;
          return (
            <li key={category.slug} className={`${card} flex flex-col gap-3`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{category.name}</h2>
                  <p className="text-sm text-stone-600 dark:text-stone-400">{category.description}</p>
                </div>
                {playable && <TodayBadge category={category.slug} />}
              </div>
              {playable ? (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/${category.slug}`}
                    className="flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    Desafio diário
                  </Link>
                  <Link
                    href={`/${category.slug}/infinito`}
                    className="flex min-h-11 items-center justify-center rounded-xl border-2 border-stone-300 px-3 text-sm font-semibold hover:border-stone-500 dark:border-stone-700 dark:hover:border-stone-500"
                  >
                    Infinito
                  </Link>
                </div>
              ) : (
                <p className="text-sm font-medium text-stone-500">Em breve</p>
              )}
              {playable && (
                <p className="text-xs text-stone-500">{category.songCount.toLocaleString("pt-BR")} músicas</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
