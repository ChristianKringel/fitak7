import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DailyGame } from "@/components/DailyGame";
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

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Desafio diário</p>
        <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
      </div>
      <DailyGame category={category.slug} categoryName={category.name} />
    </div>
  );
}
