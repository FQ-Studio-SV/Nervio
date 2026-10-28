import Link from "next/link";
import {
  IconChartBar,
  IconCheck,
  IconHome,
  IconRefresh,
  IconWifiOff,
} from "@tabler/icons-react";
import { AuthBackground } from "@/components/layout/auth-background";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

interface InterviewEndedPageProps {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ reason?: string }>;
}

export default async function InterviewEndedPage({
  params,
  searchParams,
}: InterviewEndedPageProps) {
  const { sessionId } = await params;
  const { reason } = await searchParams;
  const endedByPoorConnection = reason === "poor-connection";
  const session = await requireAuth(`/interview/${sessionId}/ended`);
  const interview = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
    select: { role: true },
  });

  return (
    <>
      <AuthBackground />
      <SiteHeader />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-28">
        <section className="glass-panel glow-cyan flex w-full max-w-xl flex-col items-center gap-6 rounded-3xl p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
            {endedByPoorConnection ? (
              <IconWifiOff className="size-8" stroke={1.5} />
            ) : (
              <IconCheck className="size-8" stroke={1.5} />
            )}
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              {endedByPoorConnection ? "Conexión insuficiente" : "Llamada finalizada"}
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold gradient-text">
              {endedByPoorConnection ? "Entrevista no calificable" : "Entrevista terminada"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {endedByPoorConnection
                ? "La entrevista terminó porque la calidad de conexión/audio no fue suficiente para evaluar al candidato con justicia."
                : `${interview?.role
                    ? `La llamada para ${interview.role} terminó correctamente.`
                    : "La llamada terminó correctamente."} Si el análisis post-llamada de ElevenLabs aún no está listo, podrás revisar el reporte cuando la evaluación quede disponible.`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {!endedByPoorConnection ? (
              <Button render={<Link href={`/interview/${sessionId}/report`} />}>
                <IconChartBar className="size-4" data-icon="inline-start" />
                Ver reporte
              </Button>
            ) : null}
            <Button render={<Link href="/interview/setup" />}>
              <IconRefresh className="size-4" data-icon="inline-start" />
              Nueva entrevista
            </Button>
            <Button variant="outline" render={<Link href="/" />}>
              <IconHome className="size-4" data-icon="inline-start" />
              Volver al inicio
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
