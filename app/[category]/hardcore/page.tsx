import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HardcoreGame } from "@/components/HardcoreGame";
import { PageHeading } from "@/components/PageHeading";
import { tapeColor } from "@/components/tape";
import { getCategory, listCategories } from "@/lib/server/data";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await listCategories()).map((c) => ({ category: c.slug }));
}

export async function generateMetadata(props: PageProps<"/[category]/hardcore">): Promise<Metadata> {
  const category = await getCategory((await props.params).category);
  return { title: category ? `${category.name} · Hardcore` : undefined };
}

export default async function HardcorePage(props: PageProps<"/[category]/hardcore">) {
  const category = await getCategory((await props.params).category);
  if (!category) notFound();

  const index = (await listCategories()).findIndex((c) => c.slug === category.slug);
  const color = tapeColor(index);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <PageHeading mode="Modo Hardcore" title={category.name} index={index} color={color} />
        <p className="text-[14px] leading-normal text-pretty text-muted">
          Primeiro acerte quem canta. Só então aparecem 4 músicas desse artista, todas conhecidas. O trecho começa
          num ponto aleatório da música. Vale 1 ponto pelo artista e 1 pela música.
        </p>
      </div>
      <HardcoreGame category={category.slug} categoryName={category.name} color={color} />
    </div>
  );
}
