/**
 * Seed de datos iniciales para Nervio (Fase 3 · Sprint 1).
 *
 * Crea usuarios de prueba con credenciales válidas usando la API servidor de
 * Better Auth (para que el hash de contraseña sea compatible con el login real)
 * y un conjunto de datos de dominio de ejemplo (una entrevista finalizada con
 * preguntas, respuestas, evaluación y una cita futura) para poder revisar el
 * historial, el reporte y la agenda sin tener que grabar una entrevista completa.
 *
 * Ejecutar:  pnpm db:seed         (o:  pnpm exec prisma db seed)
 * Requiere:  DATABASE_URL / POSTGRES_URL y BETTER_AUTH_SECRET definidos en .env
 *
 * Es idempotente: si los usuarios o la sesión de ejemplo ya existen, no los duplica.
 */
import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

function resolveDatabaseUrl(): string {
  const raw =
    process.env.POSTGRES_URL?.trim() ?? process.env.DATABASE_URL?.trim() ?? "";
  if (!raw) {
    throw new Error("POSTGRES_URL o DATABASE_URL no están definidos");
  }
  return raw.startsWith("jdbc:") ? raw.replace(/^jdbc:/, "") : raw;
}

const databaseUrl = resolveDatabaseUrl();
const useSupabaseSsl = databaseUrl.includes("supabase.com");
const pool = new pg.Pool({
  connectionString: databaseUrl,
  ...(useSupabaseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, requireEmailVerification: false, autoSignIn: false },
});

interface SeedUser {
  name: string;
  email: string;
  password: string;
}

// Usuarios de prueba preconfigurados para la revisión de la Fase 3.
const SEED_USERS: SeedUser[] = [
  { name: "Candidata Demo", email: "demo@nervio.dev", password: "Nervio#2026" },
  { name: "Candidato QA", email: "qa@nervio.dev", password: "Nervio#2026" },
];

async function ensureUser(user: SeedUser): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { email: user.email } });
  if (existing) {
    console.log(`• Usuario ya existe: ${user.email}`);
    return existing.id;
  }
  await auth.api.signUpEmail({
    body: { name: user.name, email: user.email, password: user.password },
  });
  const created = await prisma.user.findUnique({ where: { email: user.email } });
  if (!created) throw new Error(`No se pudo crear el usuario ${user.email}`);
  console.log(`✓ Usuario creado: ${user.email}  (contraseña: ${user.password})`);
  return created.id;
}

async function seedSampleInterview(userId: string): Promise<void> {
  const SEED_ROLE = "Frontend Developer (demo seed)";

  const already = await prisma.interviewSession.findFirst({
    where: { userId, role: SEED_ROLE },
    select: { id: true },
  });
  if (already) {
    console.log("• Entrevista de ejemplo ya existe, se omite.");
    return;
  }

  const session = await prisma.interviewSession.create({
    data: {
      userId,
      interviewType: "tecnico",
      role: SEED_ROLE,
      level: "mid",
      stack: "React, Next.js, TypeScript, PostgreSQL",
      extraContext: "Candidato con dos años de experiencia construyendo SPAs.",
      stressMode: false,
      status: "ended",
      startedAt: new Date(Date.now() - 40 * 60 * 1000),
      endedAt: new Date(Date.now() - 10 * 60 * 1000),
    },
  });

  const q1 = await prisma.questions.create({
    data: {
      sessionId: session.id,
      questionText: "Cuéntame sobre un proyecto reciente con React y qué rol tuviste.",
      orderIndex: 1,
      isFollowup: false,
    },
  });
  const q2 = await prisma.questions.create({
    data: {
      sessionId: session.id,
      questionText: "¿Cómo manejas el estado del servidor frente al estado del cliente?",
      orderIndex: 2,
      isFollowup: false,
    },
  });

  await prisma.responses.createMany({
    data: [
      {
        sessionId: session.id,
        questionId: q1.id,
        responseText:
          "Lideré el frontend de un panel de métricas en Next.js, migrando a App Router y Server Components.",
      },
      {
        sessionId: session.id,
        questionId: q2.id,
        responseText:
          "Uso React Query para estado del servidor con cache e invalidación, y useState/Context solo para UI local.",
      },
    ],
  });

  await prisma.evaluations.create({
    data: {
      sessionId: session.id,
      scoreGlobal: 82,
      scoreClarity: 85,
      scoreKnowledge: 80,
      scoreConfidence: 78,
      scoreStructure: 84,
      strengths: JSON.stringify([
        "Respuestas estructuradas con ejemplos concretos",
        "Buen dominio del ecosistema React/Next.js",
      ]),
      weaknesses: JSON.stringify([
        "Profundizar en trade-offs de rendimiento",
        "Agregar métricas de impacto cuantificables",
      ]),
      recommendation:
        "Buen desempeño general. Sigue practicando respuestas con resultados medibles.",
    },
  });

  const scheduledAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  await prisma.schedules.create({
    data: {
      sessionId: session.id,
      userId,
      scheduledAt,
      candidateName: "Candidata Demo",
      reminderOffsetMinutes: 60,
      reminderAt: new Date(scheduledAt.getTime() - 60 * 60 * 1000),
    },
  });

  console.log(`✓ Entrevista de ejemplo creada (sessionId=${session.id}) con reporte y cita.`);
}

async function main() {
  console.log("→ Sembrando datos de prueba de Nervio...");
  const firstUserId = await ensureUser(SEED_USERS[0]);
  for (const user of SEED_USERS.slice(1)) {
    await ensureUser(user);
  }
  await seedSampleInterview(firstUserId);
  console.log("✔ Seed completado.");
}

main()
  .catch((error) => {
    console.error("✗ Error en el seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
