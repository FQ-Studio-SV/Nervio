# Nervio — App (Frontend + API)

Nervio es un simulador de entrevistas técnicas con IA y voz en tiempo real. Esta aplicación
**Next.js (App Router)** es un monolito modular full-stack: contiene la interfaz de usuario y, a la
vez, el backend como **Route Handlers** (`src/app/api/*`). La voz en tiempo real se delega a
**ElevenLabs** (WebSocket) y la persistencia a **PostgreSQL** mediante **Prisma ORM**.

> Entrega **Fase 3 — Implementación y Despliegue del MVP (Sprint 1)**.

## 1. Prerrequisitos

| Herramienta | Versión recomendada | Notas |
|-------------|---------------------|-------|
| Node.js     | ≥ 20 (probado en 20/22/24) | Runtime de Next.js 16 / React 19 |
| pnpm        | ≥ 9                 | Gestor de paquetes (hay `pnpm-lock.yaml`) |
| PostgreSQL  | ≥ 14 (Supabase o local) | Base de datos relacional |
| Cuenta ElevenLabs | ConvAI + TTS   | Agente conversacional y síntesis de voz |
| Cuenta Resend (opcional) | —        | Correos de confirmación y recordatorio de citas |

## 2. Instalación

```bash
cd frontend
pnpm install          # instala dependencias y ejecuta `prisma generate` (postinstall)
cp .env.example .env  # y completa los valores (ver sección 3)
```

## 3. Variables de entorno

Copia `.env.example` a `.env` y completa los valores. Estructura principal:

| Variable | Obligatoria | Descripción |
|----------|:----------:|-------------|
| `POSTGRES_URL` / `DATABASE_URL` | ✅ | Cadena de conexión en runtime (Supabase pooler, puerto 6543). |
| `DIRECT_URL` | ✅ | Conexión directa (puerto 5432) usada por las migraciones Prisma. |
| `BETTER_AUTH_SECRET` | ✅ | Secreto de sesión (`openssl rand -base64 32`). |
| `BETTER_AUTH_URL` / `NEXT_PUBLIC_BETTER_AUTH_URL` | ✅ | URL base de autenticación. |
| `ELEVENLABS_API_KEY` | ✅* | API key del servidor (nunca usar prefijo `NEXT_PUBLIC_`). |
| `ELEVENLABS_AGENT_ID` / `ELEVENLABS_VOICE_ID` | ✅* | Agente ConvAI y voz TTS. |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL pública (enlaces de los correos de citas). |
| `RESEND_API_KEY` / `EMAIL_FROM` | ➖ | Envío de correos (si vacío, se omite el correo sin romper el flujo). |
| `N8N_WEBHOOK_*` | ➖ | Webhooks opcionales; si faltan, se usa el fallback local de preguntas. |
| `CRON_SECRET` | ➖ | Bearer que protege `GET /api/cron/reminders`. |
| `NEXT_PUBLIC_USE_MOCK_INTERVIEW` | ➖ | `true` para probar sin ElevenLabs (modo mock local). |

\* Opcional solo si corres en modo mock (`NEXT_PUBLIC_USE_MOCK_INTERVIEW=true`).

## 4. Base de datos: creación y datos de prueba

Las migraciones Prisma son el **DDL** del proyecto (`prisma/migrations/`).

```bash
# Aplica el esquema a la base de datos (crea tablas, índices y relaciones)
pnpm db:migrate          # = prisma migrate deploy
#   en desarrollo puedes usar:  pnpm exec prisma migrate dev

# Carga usuarios de prueba y una entrevista de ejemplo (idempotente)
pnpm db:seed             # = tsx prisma/seed.ts
```

El seed (`prisma/seed.ts`) crea credenciales válidas vía Better Auth:

| Usuario | Correo | Contraseña |
|---------|--------|-----------|
| Candidata Demo | `demo@nervio.dev` | `Nervio#2026` |
| Candidato QA   | `qa@nervio.dev`   | `Nervio#2026` |

Además inserta una entrevista finalizada con preguntas, respuestas, evaluación (reporte) y una
cita futura, para revisar historial, reporte y agenda sin grabar una entrevista completa.

> Reinicio total de la base (¡borra datos!): `pnpm db:reset`.

## 5. Ejecución en local

```bash
pnpm dev     # http://localhost:3000
```

Recorrido del MVP: **Registro → Login → Configurar entrevista → Entrevista en vivo →
Reporte → Historial → Agendar**.

## 6. Pruebas manuales de la API

Importa `../nervio-api.postman_collection.json` (raíz del repo) en Postman / Thunder Client /
Insomnia. Autentica con **Auth → Sign In** (la cookie de sesión queda en el cookie jar) y luego
ejecuta los endpoints de entrevista y agenda. Detalle en el documento de la Fase 3.

## 7. Scripts disponibles

| Script | Acción |
|--------|--------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | `prisma generate && next build` |
| `pnpm start` | Servidor de producción |
| `pnpm lint` | Linter (Biome) |
| `pnpm format` | Formateo (Biome) |
| `pnpm db:migrate` | Aplica migraciones |
| `pnpm db:seed` | Siembra datos de prueba |
| `pnpm db:reset` | Reinicia la base y re-migra |

## 8. Despliegue (Vercel)

- **Build command:** `prisma generate && next build` · **Install:** `pnpm install`.
- **Variables de entorno:** las de la sección 3 (usar `DIRECT_URL` para migraciones y
  `POSTGRES_URL` para runtime).
- **Cron:** `vercel.json` programa `GET /api/cron/reminders` cada minuto (protegido por
  `CRON_SECRET`) para enviar recordatorios de citas.
- **Base de datos:** PostgreSQL gestionado (Supabase). Ejecutar `prisma migrate deploy` contra
  `DIRECT_URL` en el pipeline de despliegue.

## 9. Estructura relevante

```
frontend/
├── src/app/                 # Páginas (UI) + API Route Handlers (/api/*)
│   ├── api/auth/            # Better Auth (registro, login, sesión)
│   ├── api/interview/       # start, messages, end, report, schedule
│   └── api/elevenlabs/      # token efímero para WebSocket
├── src/lib/                 # Dominio: auth, prisma, interview/*, email/*
├── prisma/                  # schema.prisma, migrations/, seed.ts
└── src/components/          # UI (shadcn/base-ui), entrevista, layout
```
