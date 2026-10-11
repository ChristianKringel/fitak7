import Link from "next/link";

import { Cassette } from "@/components/Cassette";
import { TapeWindow } from "@/components/TapeWindow";
import { TodayBadge } from "@/components/TodayBadge";
import { inkButton, paperLabel, secondaryButton } from "@/components/styles";
import { tapeColor, tapeNumber } from "@/components/tape";
import { NORMAL_CLIP_SECONDS } from "@/lib/game/config";
import { OPTIONS_PER_ROUND } from "@/lib/game/options";
import { ROUNDS_PER_DAY } from "@/lib/game/schedule";
import { listCategories } from "@/lib/server/data";

export default async function Home() {
  const categories = await listCategories();

  return (
    <div className="flex flex-col">
      <section className="flex flex-col gap-2.5">
        <h1 className="text-4xl leading-none font-black tracking-[-0.02em]">
          Qual é a <span className="text-accent">música?</span>
        </h1>
        <p className="text-[15px] leading-normal text-pretty text-muted">
          Ouça {NORMAL_CLIP_SECONDS} segundos e escolha entre {OPTIONS_PER_ROUND} opções. São{" "}
          {ROUNDS_PER_DAY} músicas por dia em cada categoria, iguais para todo mundo.
        </p>
      </section>

      <Link
        href="/multiplayer"
        className="key mt-5 flex items-center gap-3 rounded-2xl border-2 border-ink bg-tape-yellow px-4 py-3.5 text-ink shadow-[0_4px_0_var(--key-shadow)] hover:bg-[#ffe47a]"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase">Multiplayer</span>
          <span className="text-[17px] leading-tight font-extrabold">Desafie a turma</span>
          <span className="text-[13px] leading-snug">Crie uma sala, mande o link e veja quem acerta mais.</span>
        </span>
        <span aria-hidden className="text-2xl font-black">
          →
        </span>
      </Link>

      <h2 className="eyebrow pt-[22px] pb-3 text-accent">Escolha sua fita</h2>

      <ul className="flex flex-col gap-[22px]">
        {categories.map((category, index) => {
          const playable = category.songCount >= OPTIONS_PER_ROUND;
          return (
            <li key={category.slug}>
              <Cassette color={tapeColor(index)}>
                <div className={`${paperLabel} flex flex-col gap-1.5 px-3.5 pt-3 pb-3.5`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold tracking-[0.12em]">
                      K7 {tapeNumber(index)}
                    </span>
                    {playable && <TodayBadge category={category.slug} />}
                  </div>
                  <h3 className="border-b-[1.5px] border-paper-line pb-1 font-marker text-[27px] leading-[1.1]">
                    {category.name}
                  </h3>
                  <p className="text-[13px] leading-[1.4] text-paper-muted">{category.description}</p>
                  <TapeWindow className="mt-1.5">
                    {playable ? `${category.songCount.toLocaleString("pt-BR")} músicas` : "Em breve"}
                  </TapeWindow>
                </div>

                {playable && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <Link href={`/${category.slug}`} className={`${inkButton} px-2`}>
                      <PlayIcon />
                      Desafio diário
                    </Link>
                    {/* The endless mode is hidden (INFINITE_ENABLED); hardcore takes its place. */}
                    <Link href={`/${category.slug}/hardcore`} className={`${secondaryButton} px-2`}>
                      <SkullIcon />
                      Hardcore
                    </Link>
                  </div>
                )}
              </Cassette>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path d="M3 1.5l9.5 5.5L3 12.5z" fill="#FFD21F" />
    </svg>
  );
}

function SkullIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M8 1.5c-3.6 0-6 2.4-6 5.6 0 1.9.9 3.2 2.2 4v2.4h7.6v-2.4c1.3-.8 2.2-2.1 2.2-4 0-3.2-2.4-5.6-6-5.6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="5.6" cy="7.4" r="1.4" fill="currentColor" />
      <circle cx="10.4" cy="7.4" r="1.4" fill="currentColor" />
      <path d="M6.8 13.5v-1.6M9.2 13.5v-1.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
