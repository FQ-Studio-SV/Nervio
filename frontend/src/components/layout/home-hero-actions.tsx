import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HomeHeroActions({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
      {isAuthenticated ? (
        <Button size="lg" render={<Link href="/interview/setup" />}>
          Configurar entrevista
        </Button>
      ) : (
        <>
          <Button size="lg" render={<Link href="/register" />}>
            Empezar gratis
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/login" />}>
            Iniciar sesión
          </Button>
        </>
      )}
    </div>
  );
}
