import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InfiniteGame } from "@/components/InfiniteGame";
import { PageHeading } from "@/components/PageHeading";
import { tapeColor } from "@/components/tape";
import { getCategory, listCategories } from "@/lib/server/data";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await listCategories()).map((c) => ({ category: c.slug }));
}

export async function generateMetadata(props: PageProps<"/[category]/infinito">): Promise<Metadata> {
  const category = await getCategory((await props.params).category);
  return { title: category ? `${category.name} · Infinito` : undefined };
}

export default async function InfinitePage(props: PageProps<"/[category]/infinito">) {
  const category = await getCategory((await props.params).category);
  if (!category) notFound();

  const index = (await listCategories()).findIndex((c) => c.slug === category.slug);
  const color = tapeColor(index);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading mode="Modo infinito" title={category.name} index={index} color={color} />
      <InfiniteGame category={category.slug} color={color} />
    </div>
  );
}
