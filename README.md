# Nervio — Simulador de entrevistas con IA y voz

Monorepo del proyecto **Nervio** (Buildathon). Entrega actual: **Fase 3 — Implementación y
Despliegue del MVP (Sprint 1)**.

## Estructura

| Carpeta / archivo | Contenido |
|-------------------|-----------|
| [`frontend/`](./frontend) | Aplicación Next.js (UI + API Route Handlers), Prisma y seeds. **Empieza aquí:** [`frontend/README.md`](./frontend/README.md). |
| [`backend/`](./backend) | Documentación SDD (Spec-Driven Development): constitución, specs y plan. |
| [`nervio-api.postman_collection.json`](./nervio-api.postman_collection.json) | Colección de pruebas manuales de la API (Postman / Thunder / Insomnia). |
| `Actividad_evaluada_N_4_Nervio.pdf` | Documento maestro: Fase 1 (análisis) + Fase 2 (diseño). |
| `Actividad_evaluada_Fase3_Nervio.docx` | Informe de la Fase 3 (implementación y despliegue). |

## Arranque rápido

```bash
cd frontend
pnpm install
cp .env.example .env     # completar credenciales
pnpm db:migrate          # aplica el esquema (DDL)
pnpm db:seed             # usuarios y datos de prueba
pnpm dev                 # http://localhost:3000
```

Detalle de prerrequisitos, variables de entorno, base de datos, pruebas de API y despliegue en
[`frontend/README.md`](./frontend/README.md).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS · Better Auth · Prisma ORM +
PostgreSQL · ElevenLabs (ConvAI / TTS) · Resend · Vercel (hosting + cron).
