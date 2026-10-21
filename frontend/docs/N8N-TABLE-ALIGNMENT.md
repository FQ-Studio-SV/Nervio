# Alineación tablas N8N ↔ Prisma

El workflow `nervio_n8n_workflow_v2.json` y nuestro schema Prisma no usan exactamente los mismos nombres de tabla.

## Diferencia principal

| Workflow N8N (nodo n2) | Prisma / app Nervio |
|------------------------|---------------------|
| `sessions` | `interview_sessions` |
| `questions` | `questions` (mismo nombre) |

## Qué hacer en N8N

En el nodo **Supabase - Crear Sesion** (n2), cambiar:

```
tableId: "sessions"  →  tableId: "interview_sessions"
```

Así N8N y la app escriben en la misma tabla.

## Qué hace nuestra app

Tras recibir la respuesta de N8N, `src/lib/interview/sync-session.ts`:

1. Hace `upsert` en `interview_sessions` con el `sessionId` devuelto por N8N.
2. Inserta las preguntas en `questions`.

Esto garantiza que la app funcione aunque N8N aún apunte a `sessions`, pero **recomendamos alinear el workflow** para evitar datos duplicados en dos tablas.

## Payload N8N (entrada)

```json
{
  "user_id": "uuid",
  "interview_type": "hr | tecnico | no_tecnico | agresivo",
  "role": "Frontend Developer",
  "level": "junior | mid | senior",
  "stack": "React, TypeScript",
  "extra_context": "Candidato: Juan\n\nDetalle del perfil...",
  "stress_mode": false
}
```

Generado por `toN8nGenerateInterviewPayload()` en `src/lib/interview/n8n.ts`.

## Respuesta N8N (salida)

```json
{
  "sessionId": "uuid",
  "questions": [
    {
      "session_id": "uuid",
      "question_text": "...",
      "order_index": 1,
      "is_followup": false
    }
  ]
}
```
