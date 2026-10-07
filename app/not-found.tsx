import Link from "next/link";

import { primaryButton } from "@/components/styles";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="eyebrow text-accent">Fita enroscada</p>
      <h1 className="text-[32px] leading-none font-black tracking-[-0.02em]">Página não encontrada</h1>
      <p className="text-muted">Essa categoria ou página não existe.</p>
      <Link href="/" className={primaryButton}>
        Voltar ao início
      </Link>
    </div>
  );
}
