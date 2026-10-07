import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DailyGame } from "@/components/DailyGame";
import { PageHeading } from "@/components/PageHeading";
import { tapeColor } from "@/components/tape";
import { getCategory, listCategories } from "@/lib/server/data";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await listCategories()).map((c) => ({ category: c.slug }));
}

export async function generateMetadata(props: PageProps<"/[category]">): Promise<Metadata> {
  const category = await getCategory((await props.params).category);
  return { title: category ? `${category.name} · Desafio diário` : undefined };
}

export default async function DailyPage(props: PageProps<"/[category]">) {
  const category = await getCategory((await props.params).category);
  if (!category) notFound();

  const index = (await listCategories()).findIndex((c) => c.slug === category.slug);
  const color = tapeColor(index);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading mode="Desafio diário" title={category.name} index={index} color={color} />
      <DailyGame category={category.slug} categoryName={category.name} color={color} />
    </div>
  );
}
