"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconBrain } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/interview/setup", label: "Practicar", requiresAuth: true },
  { href: "#", label: "Metodología" },
  { href: "#", label: "Precios" },
];

export function SiteHeader() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between border-b border-white/5 bg-background/40 px-6 backdrop-blur-md lg:px-20">
      <Link href="/" className="flex items-center gap-2">
        <IconBrain className="size-8 text-primary" stroke={1.5} />
        <span className="font-[family-name:var(--font-heading)] text-lg font-bold tracking-tight text-primary">
          Nervio
        </span>
      </Link>

      <nav className="hidden gap-12 md:flex">
        {navLinks.map((link) => {
          if (link.requiresAuth && !session) return null;
          return (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:text-primary data-[active=true]:border-b-2 data-[active=true]:border-primary data-[active=true]:pb-1 data-[active=true]:font-bold data-[active=true]:text-primary"
              data-active={link.href === "/" ? true : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-4">
        {isPending ? (
          <div className="h-8 w-24 animate-pulse rounded-xl bg-muted" />
        ) : session ? (
          <>
            <span className="hidden text-sm text-muted-foreground md:inline">
              {session.user.name}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Cerrar sesión
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="hidden text-muted-foreground md:inline-flex"
              render={<Link href="/login" />}
            >
              Iniciar sesión
            </Button>
            <Button size="sm" render={<Link href="/register" />}>
              Empezar gratis
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
