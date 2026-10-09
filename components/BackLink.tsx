import Link from "next/link";

export function BackLink({ href = "/", label = "Categorias" }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      className="-ml-1 flex min-h-11 w-fit items-center gap-1.5 px-1 text-[13px] font-semibold text-muted hover:text-fg"
    >
      <span aria-hidden>←</span>
      {label}
    </Link>
  );
}
