import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuthBackground } from "@/components/layout/auth-background";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ScheduleEditForm } from "@/components/interview/schedule-edit-form";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth-server";
import type { ExperienceLevel, InterviewType } from "@/lib/interview/types";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ scheduleId: string }> };

export default async function EditSchedulePage({ params }: PageProps) {
  const session = await requireAuth("/interview/schedules");
  const { scheduleId } = await params;

  const schedule = await prisma.schedules.findFirst({
    where: { id: scheduleId, userId: session.user.id },
    include: { interviewSession: true },
  });

  if (!schedule?.interviewSession) {
    notFound();
  }

  if (schedule.scheduledAt.getTime() <= Date.now()) {
    redirect("/interview/schedules");
  }

  const interview = schedule.interviewSession;

  return (
    <>
      <AuthBackground />
      <SiteHeader />
      <main className="relative z-10 flex min-h-screen flex-col items-center px-6 py-28">
        <ScheduleEditForm
          initial={{
            scheduleId: schedule.id,
            scheduledAt: schedule.scheduledAt,
            reminderOffsetMinutes: schedule.reminderOffsetMinutes,
            role: interview.role,
            candidateName:
              schedule.candidateName.trim() || session.user.name || "",
            level: interview.level as ExperienceLevel,
            interviewType: interview.interviewType as InterviewType,
            extraContext: interview.extraContext ?? "",
            stack: interview.stack ?? "",
          }}
        />
        <Button
          variant="ghost"
          className="mt-6"
          render={<Link href="/interview/schedules" />}
        >
          Volver a la agenda
        </Button>
      </main>
      <SiteFooter />
    </>
  );
}
