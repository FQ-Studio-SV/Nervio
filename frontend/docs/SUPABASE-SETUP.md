# Base de datos en Supabase (Nervio)

El schema está en `prisma/schema.prisma`. La migración inicial es `prisma/migrations/20260704213008_init/migration.sql`.

## 1. Proyecto en Supabase

1. Entra a [supabase.com/dashboard](https://supabase.com/dashboard).
2. Crea un proyecto (o **Restore** si está pausado por inactividad).
3. Anota la **contraseña** de la base de datos.

## 2. Variables en `frontend/.env`

En **Project Settings → Database → Connection string**:

| Uso | Modo en Supabase | Variable |
|-----|------------------|----------|
| App en dev/prod | **Transaction pooler**, puerto **6543**, usuario `postgres.[PROJECT_REF]` | `POSTGRES_URL` (recomendado; evita colisión con `DATABASE_URL` JDBC del sistema en Windows) |
| Prisma migrate | **Direct connection**, puerto **5432**, usuario `postgres` | `DIRECT_URL` |

Ejemplo (sustituye `[PROJECT_REF]`, `[REGION]` y la contraseña):

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require"
```

Copiar las cadenas desde el panel evita errores de región o usuario.

## 3. Crear tablas (elige una opción)

### Opción A — Prisma (recomendada)

Desde `frontend/`:

```bash
pnpm install
pnpm exec prisma migrate deploy
pnpm exec prisma generate
```

Si termina sin errores, ya tienes: `user`, `session`, `account`, `verification`, `interview_sessions`, `questions`, `responses`, `evaluations`, `recordings`, `schedules`, `webhook_logs`.

### Opción B — SQL Editor en Supabase

Si `migrate deploy` no conecta desde tu red:

1. **SQL → New query**
2. Pega el contenido de `prisma/migrations/20260704213008_init/migration.sql`
3. **Run**
4. Cuando puedas usar Prisma contra la base directa:

```bash
pnpm exec prisma migrate resolve --applied 20260704213008_init
```

## 4. Comprobar

```bash
pnpm dev
```

Regístrate en `http://localhost:3000/register`. Si el registro funciona, Better Auth y Postgres están bien enlazados.

## Errores frecuentes

| Error | Qué revisar |
|-------|-------------|
| `P1001 Can't reach database server` | Proyecto pausado, contraseña incorrecta, o `DIRECT_URL` apuntando al pooler en lugar de `db.[ref].supabase.co` |
| `(ENOTFOUND) tenant/user postgres.[ref] not found` | `PROJECT_REF`, región (`aws-0-[REGION]`) o contraseña incorrectos; copia de nuevo la cadena desde el panel de Supabase |
| Prisma `ECONNREFUSED` en Windows | Suele ser `DATABASE_URL` del sistema con prefijo `jdbc:`; usa `POSTGRES_URL` en `.env` con `postgresql://...` |
| `gen_random_uuid` | Supabase (PostgreSQL 15+) ya lo incluye; no hace falta extensión extra |
| Login OK pero entrevistas fallan | `DATABASE_URL` debe ser pooler **6543**, no la URL directa |
