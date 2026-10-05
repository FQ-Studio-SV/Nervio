import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireAuth(callbackPath?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    const callback = callbackPath
      ? `?callbackUrl=${encodeURIComponent(callbackPath)}`
      : "";
    redirect(`/login${callback}`);
  }

  return session;
}
