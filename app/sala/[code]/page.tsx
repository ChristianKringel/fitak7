import type { Metadata } from "next";

import { RoomGame } from "@/components/RoomGame";
import { tapeColor } from "@/components/tape";
import { parseRoomCode } from "@/lib/game/room";
import { listCategories } from "@/lib/server/data";

export async function generateMetadata(props: PageProps<"/sala/[code]">): Promise<Metadata> {
  const code = parseRoomCode((await props.params).code);
  return { title: code ? `Sala ${code}` : "Sala" };
}

export default async function RoomPage(props: PageProps<"/sala/[code]">) {
  const { code: param } = await props.params;
  const code = parseRoomCode(param) ?? param;
  const colors = Object.fromEntries((await listCategories()).map((c, i) => [c.slug, tapeColor(i)]));

  // Keyed so a rematch (another code) starts from a clean state.
  return <RoomGame key={code} code={code} colors={colors} />;
}
