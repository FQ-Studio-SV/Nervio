import Link from "next/link";
import { IconBrain, IconLanguage, IconWorld } from "@tabler/icons-react";

export function SiteFooter() {
  return (
    <footer className="relative z-10 w-full border-t border-white/5 px-6 py-12 lg:px-20">
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-2 opacity-50 grayscale">
          <IconBrain className="size-5 text-foreground" stroke={1.5} />
          <span className="font-[family-name:var(--font-heading)] text-sm font-bold">
            Nervio AI
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Nervio AI. Forjado para el éxito
          profesional.
        </p>
        <div className="flex gap-8">
          <Link
            href="#"
            className="text-muted-foreground transition-colors hover:text-primary"
            aria-label="Idioma"
          >
            <IconLanguage className="size-5" />
          </Link>
          <Link
            href="#"
            className="text-muted-foreground transition-colors hover:text-primary"
            aria-label="Comunidad"
          >
            <IconWorld className="size-5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
