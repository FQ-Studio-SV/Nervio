import { RegisterForm } from "@/components/auth/register-form";
import { AuthBackground } from "@/components/layout/auth-background";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function RegisterPage() {
  return (
    <>
      <AuthBackground />
      <SiteHeader />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-20">
        <RegisterForm />
      </main>

      <SiteFooter />
    </>
  );
}
