import { AuthBackground } from "@/components/layout/auth-background";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { InterviewSetupForm } from "@/components/interview/interview-setup-form";
import { requireAuth } from "@/lib/auth-server";

export default async function InterviewSetupPage() {
  await requireAuth("/interview/setup");

  return (
    <>
      <AuthBackground />
      <SiteHeader />
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-28">
        <InterviewSetupForm />
      </main>
      <SiteFooter />
    </>
  );
}
