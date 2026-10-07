import Link from "next/link";

import { primaryButton } from "@/components/styles";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="text-stone-600 dark:text-stone-400">Essa categoria ou página não existe.</p>
      <Link href="/" className={primaryButton}>
        Voltar ao início
      </Link>
    </div>
  );
}
