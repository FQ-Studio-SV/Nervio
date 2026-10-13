import Link from "next/link";
import {
  IconBrandWhatsapp,
  IconCalendarEvent,
  IconClock,
  IconMail,
  IconPlus,
} from "@tabler/icons-react";
import { AuthBackground } from "@/components/layout/auth-background";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { INTERVIEW_TYPE_OPTIONS } from "@/lib/interview";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(value);
}

function getScheduleState(scheduledAt: Date) {
  return scheduledAt.getTime() < Date.now() ? "Vencida" : "Próxima";
}

export default async function InterviewSchedulesPage() {
  const session = await requireAuth("/interview/schedules");
  const schedules = await prisma.schedules.findMany({
    where: { userId: session.user.id },
    include: { interviewSession: true },
    orderBy: { scheduledAt: "asc" },
  });

  return (
    <>
      <AuthBackground />
      <SiteHeader />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-28">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Agenda</p>
          <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold gradient-text">
            Entrevistas agendadas
          </h1>
          <p className="mt-2 text-muted-foreground">
            Visualiza las citas creadas para que N8N gestione recordatorios.
          </p>
        </div>

        {schedules.length === 0 ? (
          <div className="glass-panel flex flex-col items-center gap-4 rounded-2xl p-8 text-center">
            <IconCalendarEvent className="size-10 text-primary" stroke={1.5} />
            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold">
                No hay citas agendadas
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Agenda una simulación para verla aquí.
              </p>
            </div>
            <Button render={<Link href="/interview/setup" />}>
              Agendar entrevista
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {schedules.map((schedule) => {
              const interview = schedule.interviewSession;
              const typeLabel = interview
                ? INTERVIEW_TYPE_OPTIONS.find(
                    (option) => option.value === interview.interviewType,
                  )?.label ?? interview.interviewType
                : "Sin sesión asociada";
              const state = getScheduleState(schedule.scheduledAt);

              return (
                <article
                  key={schedule.id}
                  className="glass-panel flex flex-col gap-5 rounded-2xl p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconClock className="size-4" />
                        {formatDate(schedule.scheduledAt)}
                      </div>
                      <h2 className="mt-2 font-[family-name:var(--font-heading)] text-xl font-semibold">
                        {interview?.role ?? "Entrevista sin detalle"}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {typeLabel}
                        {interview?.level ? ` · ${interview.level}` : ""}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-2 text-center">
                      <p className="text-xs text-muted-foreground">Estado</p>
                      <p className="font-[family-name:var(--font-heading)] text-lg font-bold text-primary">
                        {state}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-wide">Schedule ID</p>
                      <p className="mt-1 break-all font-mono text-xs text-foreground">
                        {schedule.id}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-wide">Session ID</p>
                      <p className="mt-1 break-all font-mono text-xs text-foreground">
                        {schedule.sessionId ?? "Sin sesión"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-muted-foreground">
                      <IconMail className="size-4" />
                      Email: {schedule.reminderEmailSent ? "enviado" : "pendiente"}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-muted-foreground">
                      <IconBrandWhatsapp className="size-4" />
                      WhatsApp:{" "}
                      {schedule.reminderWhatsappSent ? "enviado" : "pendiente"}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="flex justify-center">
          <Button render={<Link href="/interview/setup" />}>
            <IconPlus className="size-4" />
            Nueva cita
          </Button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
