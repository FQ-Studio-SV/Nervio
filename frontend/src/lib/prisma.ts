import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function resolveDatabaseUrl(): string {
  const raw =
    process.env.POSTGRES_URL?.trim() ??
    process.env.DATABASE_URL?.trim() ??
    "";
  if (!raw) {
    throw new Error("POSTGRES_URL or DATABASE_URL is not set");
  }
  return raw.startsWith("jdbc:") ? raw.replace(/^jdbc:/, "") : raw;
}

const databaseUrl = resolveDatabaseUrl();
const useSupabaseSsl = databaseUrl.includes("supabase.com");

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ...(useSupabaseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as { prisma?: PrismaClient };

function createPrismaClient() {
  return new PrismaClient({ adapter });
}

/** En dev no reutilizamos el singleton global: tras `prisma generate` el proceso puede seguir con un cliente viejo que aún consulta columnas eliminadas. */
export const prisma =
  process.env.NODE_ENV === "production"
    ? (globalForPrisma.prisma ?? createPrismaClient())
    : createPrismaClient();

if (process.env.NODE_ENV === "production") {
  globalForPrisma.prisma = prisma;
}
