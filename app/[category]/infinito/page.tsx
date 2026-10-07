import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InfiniteGame } from "@/components/InfiniteGame";
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

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Modo infinito</p>
        <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
      </div>
      <InfiniteGame category={category.slug} />
    </div>
  );
}
