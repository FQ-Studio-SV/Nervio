# 🧠 Nervio — Backend

Núcleo en **tiempo real** de Nervio (simulador de entrevistas con IA y voz). Este backend orquesta la conversación en vivo de la entrevista: transcribe el audio del usuario, genera la réplica del entrevistador con IA y la devuelve como voz, delegando en **N8N** todo lo asíncrono (generación inicial de preguntas, evaluación profunda, reportes y recordatorios).

> Este proyecto se desarrolla con **SDD — Spec-Driven Development**: primero se escribe la especificación, luego el plan y las tareas, y solo después el código. La documentación es la fuente de verdad.

---

## 📐 ¿Qué es SDD (Spec-Driven Development)?

SDD invierte el flujo tradicional: en lugar de "código primero, documentar después", **la especificación es el artefacto central** y el código se deriva de ella. Beneficios: contratos claros antes de implementar, decisiones trazables, menor retrabajo y onboarding rápido.

### Fases de la metodología

| Fase | Artefacto | Pregunta que responde | Estado |
|------|-----------|-----------------------|--------|
| 0 · **Constitution** | `.specify/memory/constitution.md` | ¿Qué principios son innegociables? | ✅ Creado |
| 1 · **Specify** | `specs/<feature>/spec.md` | ¿QUÉ construimos y POR QUÉ? | ✅ Creado (001) |
| 2 · **Plan** | `specs/<feature>/plan.md` | ¿CÓMO lo construimos técnicamente? | ✅ Creado (001) |
| 3 · **Tasks** | `specs/<feature>/tasks.md` | ¿En qué pasos accionables se divide? | ⏳ Pendiente |
| 4 · **Implement** | código en `src/` | — | ⏳ Pendiente |

> Esta entrega corresponde a **las primeras partes de la metodología** (Fases 0 → 2) del lado del backend.

### Reglas del flujo

1. Ninguna fase avanza sin que la anterior esté aprobada.
2. Ante conflicto, **la constitución prevalece** sobre specs y planes.
3. Los ítems marcados **[NECESITA ACLARACIÓN]** deben resolverse en una fase *Clarify* antes de implementar.

---

## 🗂️ Estructura de la documentación

```
backend/
├── README.md                                # este archivo (índice + metodología)
├── .specify/
│   └── memory/
│       └── constitution.md                  # Fase 0 · principios del backend
└── specs/
    └── 001-interview-core/
        ├── spec.md                          # Fase 1 · el QUÉ y el PORQUÉ
        └── plan.md                          # Fase 2 · el CÓMO técnico
```

---

## 🧱 Arquitectura (resumen)

Módulos por dominio (detalle en el plan de la spec 001):

- **Interview Engine** — orquesta el flujo y la máquina de estados de la entrevista.
- **AI Engine** — adapter de OpenAI GPT (réplicas coherentes y dinámicas, prompts por perfil).
- **Voice Engine** — STT + TTS con **ElevenLabs** en streaming por WebSocket (Scribe v2 Realtime para transcripción, `stream-input` con voces por perfil para síntesis).
- **Session Manager** — estado y persistencia incremental (Supabase).
- **Stress** — detección de señales y escalado del modo estrés.
- **Scheduling / Integrations (N8N)** — agendamiento y webhooks asíncronos.

Filosofía: **tiempo real → backend**, **procesos pesados → N8N**, **UI → frontend**.

**Tiempo real:** WebSockets sobre `ws` (adaptador `WsAdapter` de NestJS, no Socket.IO) para el canal navegador↔backend, y el backend como cliente `ws` hacia los endpoints de streaming de ElevenLabs.

---

## 🚦 Cómo continuar (próximos pasos SDD)

1. **Clarify** — resolver los `[NECESITA ACLARACIÓN]` de `specs/001-interview-core/spec.md`.
2. **Tasks** — generar `specs/001-interview-core/tasks.md` con el desglose accionable.
3. **Spec 002** — Integraciones N8N (contratos de webhooks de generación y reporte).
4. **Implement** — scaffold NestJS siguiendo las fases del plan (§13).

---

## 📚 Documentación relacionada (raíz del repo)

- `../project-overview.md` — visión de producto de Nervio.
- `../project-flow.md` — arquitectura completa (App + Backend + N8N).
- `../AGENTS.md` — reglas del monorepo.
