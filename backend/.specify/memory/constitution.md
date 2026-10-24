# 🧠 Nervio Backend — Constitution

> **Fase 0 de SDD (Spec-Driven Development).**
> Este documento define los principios NO negociables que gobiernan el desarrollo del backend de Nervio.
> Toda especificación (`spec.md`), plan técnico (`plan.md`) y tarea (`tasks.md`) DEBE ser consistente con esta constitución.
> Ante un conflicto entre una decisión de implementación y este documento, **la constitución prevalece**.

- **Versión:** 1.2.0
- **Estado:** Ratificada
- **Ámbito:** `backend/` (monorepo Nervio)
- **Última actualización:** 2026-07-04

---

## 🎯 Propósito del backend

El backend de Nervio es el **núcleo en tiempo real** del sistema. Su responsabilidad es orquestar la conversación de una entrevista simulada por voz: recibir audio del usuario, transcribirlo, generar la respuesta del entrevistador con IA, convertirla a voz y devolverla con la menor latencia posible.

Lo que **NO es tiempo real** (generación inicial de preguntas, evaluación profunda, reportes finales, recordatorios) se delega a **N8N**. Lo que es **UI** vive en el **frontend**. El backend no invade ninguna de esas dos capas.

---

## 📜 Principios

### I. Separación estricta de responsabilidades (real-time vs. asíncrono)

- El backend maneja **exclusivamente** lo síncrono y de baja latencia: transcripción, turno conversacional, síntesis de voz y estado de sesión en vivo.
- Todo proceso pesado o diferido (análisis profundo, reportes, notificaciones, generación batch de preguntas) se **delega a N8N** vía webhooks.
- El backend **nunca** implementa lógica que duplique un flujo de N8N, y N8N **nunca** participa en el turno conversacional en vivo.

### II. Contract-first (la especificación manda)

- Ningún endpoint, evento WebSocket o integración externa se implementa antes de estar especificado en un `spec.md` y detallado en un `plan.md`.
- El contrato de la API (request/response, eventos, códigos de error) es la fuente de verdad. El código se ajusta al contrato, no al revés.
- Cambios de contrato requieren actualizar primero la spec y luego el código.

### III. Arquitectura modular por dominio

El backend se organiza en módulos con una sola responsabilidad clara:

- **Interview Engine** — orquesta el flujo de la entrevista y decide el siguiente turno.
- **AI Engine** — abstrae la interacción con el LLM (OpenAI GPT) que genera las réplicas coherentes del entrevistador.
- **Voice Engine** — abstrae STT y TTS, ambos provistos por **ElevenLabs** (STT con el modelo Scribe, TTS con voces por perfil).
- **Session Manager** — administra el estado y la persistencia parcial de la sesión.

Los módulos se comunican por interfaces explícitas. Ningún módulo accede a los detalles internos de otro.

### IV. Proveedores externos detrás de interfaces (adapters)

- OpenAI, ElevenLabs (STT y TTS), Supabase y N8N se consumen **siempre** a través de una interfaz/adapter propio, nunca directamente desde la lógica de negocio.
- Esto permite mockear en tests, cambiar de proveedor y aislar fallos externos.
- Ninguna clave/API key vive en el código: solo en variables de entorno.

### V. Estado explícito y observable

- Cada sesión de entrevista tiene una máquina de estados explícita (`created → running → (stress) → ending → completed`).
- Todo cambio de estado y toda llamada a un proveedor externo se registra con logs estructurados y un `sessionId` de correlación.
- El estado parcial se persiste de forma incremental para permitir la reproducción de sesión (feature diferenciador).

### VI. Resiliencia ante fallos de terceros

- Toda llamada externa tiene timeout, política de reintentos con backoff y un comportamiento de degradación definido.
- Un fallo de un proveedor (p. ej. ElevenLabs caído) **no debe** tumbar la sesión: debe degradarse (p. ej. devolver texto sin audio) y notificarse.

### VII. Autenticación pospuesta, pero contemplada

- Para el MVP, los endpoints son **públicos** (sin auth), según lo indicado en la documentación de arquitectura.
- El diseño DEBE dejar el punto de extensión (middleware/guard) para insertar Better Auth más adelante **sin refactorizar** los controladores.
- Nunca se registran datos sensibles (audio crudo, tokens) en logs.

### VIII. Simplicidad orientada al MVP

- Se prioriza lo que hace demostrable el MVP: entrevista en vivo, **cuatro tipos de entrevistador** (`hr`, `tecnico`, `no_tecnico`, `agresivo`/estrés), modo estrés, evaluación final, feedback hablado y agendamiento.
- Queda **fuera de alcance**: video, análisis facial, IA ultra personalizada por CV, multilenguaje avanzado.
- No se añade infraestructura ni abstracción que no sirva a una feature del MVP ("YAGNI").

---

## 🚧 Restricciones tecnológicas

- **Runtime:** Node.js (LTS).
- **Framework:** NestJS (preferido por su modularidad) o Node + Express como fallback.
- **Tiempo real:** WebSockets con transporte **`ws`** (no Socket.IO), en dos planos: canal navegador↔backend (NestJS `WsAdapter`) y conexiones cliente backend→ElevenLabs (STT/TTS en streaming). Socket.IO queda descartado por su overhead para audio binario.
- **Persistencia:** Supabase (Postgres).
- **IA:** OpenAI (GPT) para la conversación (réplicas coherentes del entrevistador).
- **Voz:** ElevenLabs para **STT (modelo Scribe) y TTS**.
- **Automatización:** N8N vía webhooks.
- **Config:** todo por variables de entorno; nada de secretos en el repo.

---

## 🔄 Flujo de trabajo SDD (gobernanza)

Toda feature del backend sigue este ciclo:

1. **Constitution** (este documento) — principios estables.
2. **Specify** (`specs/<feature>/spec.md`) — el QUÉ y el PORQUÉ, sin detalles de implementación.
3. **Plan** (`specs/<feature>/plan.md`) — el CÓMO técnico, alineado a la constitución.
4. **Tasks** (`specs/<feature>/tasks.md`) — desglose accionable y verificable.
5. **Implement** — código que satisface la spec y el plan.

Ninguna fase avanza sin que la anterior esté aprobada.

---

## 🗳️ Enmiendas

- Cualquier cambio a esta constitución requiere: (1) justificación escrita, (2) incremento de versión (semver) y (3) revisión de las specs afectadas.
- **MAJOR:** cambio o eliminación de un principio. **MINOR:** nuevo principio o sección. **PATCH:** aclaraciones o correcciones de redacción.

### Historial de enmiendas

- **1.1.0 (2026-07-04):** El STT pasa de Whisper a **ElevenLabs (modelo Scribe)**, unificando STT y TTS en un solo proveedor de voz. *Justificación:* menor superficie de integración y latencia consistente en el turno de voz; OpenAI GPT se mantiene como motor de conversación. *Specs afectadas:* `specs/001-interview-core/{spec.md, plan.md}`.
- **1.1.1 (2026-07-04):** Se aclara el transporte de tiempo real: WebSockets sobre **`ws`** (NestJS `WsAdapter`, no Socket.IO) y el backend como **cliente WS** hacia los endpoints de streaming de ElevenLabs (STT `scribe_v2_realtime` y TTS `stream-input`). *Justificación:* Socket.IO no es apto para streaming de audio binario de baja latencia; se mantiene NestJS. *Specs afectadas:* `specs/001-interview-core/plan.md`.
- **1.2.0 (2026-07-04):** Alineación *contract-first* con los contratos ya materializados por frontend/N8N/Prisma: (1) **cuatro** tipos de entrevista en español (`hr`, `tecnico`, `no_tecnico`, `agresivo`), (2) nombres reales del modelo de datos (`interview_sessions`, `webhook_logs`, señales de estrés en `responses`, columnas concretas de `evaluations`), (3) idioma de la entrevista: **español**. *Justificación:* la fuente de verdad de los contratos ya existe en el repo (`frontend/prisma/schema.prisma`, `recibe.json`, `respuesta.json`, `project-flow.md`); el SDD del backend debe reflejarla. *Specs afectadas:* `specs/001-interview-core/{spec.md, plan.md}`.
