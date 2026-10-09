import type { Metadata } from "next";

import { BackLink } from "@/components/BackLink";
import { MultiplayerLobby } from "@/components/MultiplayerLobby";
import { RoomRules } from "@/components/RoomRules";
import { tapeColor } from "@/components/tape";
import { OPTIONS_PER_ROUND } from "@/lib/game/options";
import { listCategories } from "@/lib/server/data";

export const metadata: Metadata = { title: "Multiplayer" };

export default async function MultiplayerPage() {
  const categories = (await listCategories()).flatMap((c, index) =>
    c.songCount >= OPTIONS_PER_ROUND ? [{ slug: c.slug, name: c.name, color: tapeColor(index) }] : [],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <BackLink />
        <p className="eyebrow text-accent">Modo desafio</p>
        <h1 className="text-[32px] leading-none font-black tracking-[-0.02em]">Multiplayer</h1>
        <p className="text-[15px] leading-normal text-pretty text-muted">
          Crie uma sala, mande o link para a turma e veja quem acerta mais. Cada um joga quando quiser.
        </p>
      </div>
      <MultiplayerLobby categories={categories} />
      <RoomRules />
    </div>
  );
}
