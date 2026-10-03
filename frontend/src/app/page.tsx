import Link from "next/link";
import { FeatureCards } from "@/components/layout/feature-cards";
import { AuthBackground } from "@/components/layout/auth-background";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <>
      <AuthBackground />
      <SiteHeader />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-20">
        <div className="container mx-auto flex w-full max-w-7xl flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-1 text-sm font-medium text-secondary">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-secondary" />
            </span>
            Nuevos escenarios de Stress Mode disponibles
          </div>

          <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight font-bold tracking-tight gradient-text sm:text-5xl lg:text-6xl">
            Domina tus entrevistas con IA en tiempo real.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Interactúa por voz con simuladores avanzados. Supera el{" "}
            <span className="font-semibold text-destructive">Stress Mode</span> y
            recibe feedback instantáneo basado en datos reales de reclutamiento.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Button size="lg" render={<Link href="/register" />}>
              Empezar gratis
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/login" />}
            >
              Iniciar sesión
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Únete a +2.000 profesionales
          </p>
        </div>

        <FeatureCards />
      </main>

      <SiteFooter />
    </>
  );
}
