import Link from "next/link";
import { IconChartBar, IconClock } from "@tabler/icons-react";
import { AuthBackground } from "@/components/layout/auth-background";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { INTERVIEW_TYPE_OPTIONS } from "@/lib/interview";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

function formatDate(value: Date | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function InterviewReportsPage() {
  const session = await requireAuth("/interview/reports");
  const reports = await prisma.interviewSession.findMany({
    where: {
      userId: session.user.id,
      status: "ended",
    },
    include: { evaluations: true },
    orderBy: { endedAt: "desc" },
  });

  return (
    <>
      <AuthBackground />
      <SiteHeader />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-28">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Historial</p>
          <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold gradient-text">
            Mis reportes
          </h1>
          <p className="mt-2 text-muted-foreground">
            Revisa tus entrevistas finalizadas y vuelve a sus resultados.
          </p>
        </div>

        {reports.length === 0 ? (
          <div className="glass-panel flex flex-col items-center gap-4 rounded-2xl p-8 text-center">
            <IconChartBar className="size-10 text-primary" stroke={1.5} />
            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold">
                Aún no hay reportes
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Finaliza una simulación para generar tu primer reporte.
              </p>
            </div>
            <Button render={<Link href="/interview/setup" />}>
              Configurar entrevista
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => {
              const typeLabel =
                INTERVIEW_TYPE_OPTIONS.find(
                  (option) => option.value === report.interviewType,
                )?.label ?? report.interviewType;

              return (
                <article
                  key={report.id}
                  className="glass-panel flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <IconClock className="size-4" />
                      {formatDate(report.endedAt)}
                    </div>
                    <h2 className="mt-2 font-[family-name:var(--font-heading)] text-xl font-semibold">
                      {report.role}
                    </h2>
                    <p className="text-sm text-muted-foreground">{typeLabel}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-2 text-center">
                      <p className="text-xs text-muted-foreground">Score</p>
                      <p className="font-[family-name:var(--font-heading)] text-2xl font-bold text-primary">
                        {report.evaluations?.scoreGlobal
                          ? Math.round(Number(report.evaluations.scoreGlobal))
                          : "--"}
                      </p>
                    </div>
                    <Button render={<Link href={`/interview/${report.id}/report`} />}>
                      Ver reporte
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
