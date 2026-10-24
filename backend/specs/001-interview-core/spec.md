# 📋 Spec 001 — Interview Core (Núcleo de Entrevista en Tiempo Real)

> **Fase 1 de SDD: Specify.**
> Describe el QUÉ y el PORQUÉ del núcleo del backend, **sin** detalles de implementación (esos van en `plan.md`).
> Debe ser consistente con `../../.specify/memory/constitution.md`.

- **Feature ID:** 001-interview-core
- **Estado:** Borrador
- **Autor:** Equipo Nervio
- **Fecha:** 2026-07-04
- **Principios aplicables:** I, II, III, IV, V, VI, VII, VIII

---

## 1. Resumen

El *Interview Core* es el conjunto de capacidades del backend que permiten llevar una entrevista simulada por voz **de principio a fin en tiempo real**. Cubre el arranque de la sesión, el ciclo conversacional (pregunta → respuesta del usuario → réplica de la IA por voz), el modo estrés y el cierre de la entrevista con disparo del reporte asíncrono.

## 2. Objetivo y motivación

**Problema:** las personas necesitan practicar entrevistas en condiciones realistas, con presión y feedback, sin depender de un entrevistador humano.

**Objetivo:** ofrecer un servicio backend capaz de sostener una conversación de entrevista natural, hablada y adaptativa, con latencia baja y una experiencia inmersiva.

**Por qué en el backend (no en N8N ni en el frontend):** el turno conversacional es síncrono y sensible a la latencia (Principio I). N8N cubre lo asíncrono; el frontend solo captura y reproduce audio.

## 3. Actores

| Actor | Descripción |
|-------|-------------|
| **Usuario entrevistado** | Persona que practica la entrevista desde el frontend. |
| **Entrevistador IA** | Persona virtual con un perfil (HR, Técnico, Estrés) que conduce la entrevista. |
| **Frontend** | Captura audio, reproduce audio, muestra estado. Consumidor de la API. |
| **N8N** | Genera el set inicial de preguntas y procesa el reporte final (asíncrono). |
| **Proveedores externos** | OpenAI (LLM), ElevenLabs (STT con Scribe + TTS), Supabase (persistencia). |

## 4. Alcance

### Dentro de alcance (MVP)

- Arranque de una sesión de entrevista a partir de la configuración del usuario.
- Ciclo conversacional por voz en tiempo real con seguimiento de contexto.
- Tres perfiles de entrevistador: **HR**, **Técnico**, **Estrés/Agresivo**.
- **Modo estrés**: detección de señales de inseguridad y adaptación del tono.
- Cierre de la entrevista y disparo del flujo de reporte en N8N.
- Persistencia incremental del estado y de los audios para reproducción de sesión.
- Agendamiento de sesiones futuras (delegando notificaciones a N8N).

### Fuera de alcance

- Autenticación / gestión de usuarios (endpoints públicos en el MVP — Principio VII).
- Generación del reporte final en sí (lo produce N8N).
- Análisis de video / lenguaje corporal.
- IA personalizada por CV, matching de empleos, multilenguaje avanzado.
- UI de cualquier tipo.

## 5. Requisitos funcionales

Cada requisito es verificable y usa lenguaje normativo (DEBE / DEBERÍA / PUEDE).

### 5.1 Configuración e inicio de entrevista

- **RF-01** El sistema DEBE aceptar una configuración de entrevista con: tipo (`hr` | `tecnico` | `no_tecnico` | `agresivo`), rol (p. ej. "Desarrollador Senior"), nivel (`junior` | `mid` | `senior`), stack tecnológico (cadena separada por comas), contexto extra libre (`extra_context`, que incluye el nombre del candidato) y un flag de modo estrés. Convención vigente: el tipo `agresivo` implica `stress_mode = true`.
- **RF-02** Al iniciar, el sistema DEBE solicitar a N8N la generación del set de preguntas base y follow-ups para esa configuración.
- **RF-03** El sistema DEBE crear una sesión persistida y devolver un `sessionId` único.
- **RF-04** Si N8N no responde a tiempo, el sistema DEBE degradarse (usar un set de preguntas de respaldo) y marcar la sesión como degradada, sin fallar el inicio.

### 5.2 Ciclo conversacional en tiempo real

- **RF-05** El sistema DEBE emitir la pregunta actual del entrevistador como **texto y audio** (TTS).
- **RF-06** El sistema DEBE aceptar la respuesta del usuario como **audio** y transcribirla a texto (STT mediante ElevenLabs / modelo Scribe).
- **RF-07** El sistema DEBE generar la réplica del entrevistador con IA (**OpenAI GPT**) usando el **contexto acumulado** de la sesión (preguntas y respuestas previas) para producir respuestas coherentes.
- **RF-08** El sistema DEBE decidir dinámicamente el siguiente turno: profundizar (follow-up), avanzar a la siguiente pregunta o cerrar.
- **RF-09** El sistema DEBE mantener el turno conversacional por un canal de baja latencia (WebSocket).
- **RF-10** El sistema DEBE persistir de forma incremental cada intercambio (texto + referencia a audio) para la reproducción posterior.

### 5.3 Perfiles de entrevistador

- **RF-11** El sistema DEBE ajustar el comportamiento del entrevistador según el perfil: **HR** (`hr`, amable, conversacional), **Técnico** (`tecnico`, directo, enfocado en conocimiento), **No técnico** (`no_tecnico`, habilidades blandas y experiencia general) y **Agresivo/Estrés** (`agresivo`, presiona, interrumpe, incomoda). Las réplicas del entrevistador DEBEN estar en **español**.
- **RF-12** El perfil DEBE reflejarse tanto en el contenido (prompt del LLM) como en la voz (parámetros de TTS).

### 5.4 Modo estrés

- **RF-13** Cuando el modo estrés esté activo, el sistema DEBE evaluar señales de inseguridad en la respuesta del usuario: pausas/silencios largos, respuestas débiles o inseguras y muletillas.
- **RF-14** Al detectar dichas señales, el sistema DEBE escalar el tono del entrevistador (prompt más agresivo, mayor presión, interrupciones simuladas).
- **RF-15** La intensidad del estrés DEBERÍA ser gradual y basarse en la acumulación de señales durante la sesión.

### 5.5 Cierre y reporte

- **RF-16** El sistema DEBE poder finalizar la entrevista a petición del usuario o cuando se agoten las preguntas.
- **RF-17** Al finalizar, el sistema DEBE disparar el flujo de reporte final en N8N (`/final-report`) con la referencia de la sesión.
- **RF-18** El sistema DEBE marcar la sesión como `completed` y dejar de aceptar turnos.
- **RF-18b** El reporte final que N8N escribe en `evaluations` y que el sistema expone DEBE tener la forma `InterviewReport`: `scoreGlobal`, `scoreClarity`, `scoreKnowledge`, `scoreConfidence`, `scoreStructure`, `strengths[]`, `weaknesses[]`, `recommendation`, más eco de `interviewType`, `role` y `candidateName` (ver `respuesta.json`).

### 5.6 Agendamiento

- **RF-19** El sistema DEBE aceptar una solicitud de agendamiento (fecha/hora + configuración) y persistirla.
- **RF-20** El sistema DEBE notificar a N8N para que gestione los recordatorios (email/WhatsApp).

## 6. Requisitos no funcionales

- **RNF-01 (Latencia):** el ciclo respuesta-del-usuario → réplica-hablada DEBERÍA percibirse conversacional (objetivo indicativo: primera respuesta audible en pocos segundos).
- **RNF-02 (Resiliencia):** un fallo de un proveedor externo DEBE degradar la experiencia, no interrumpir la sesión (Principio VI).
- **RNF-03 (Observabilidad):** todo cambio de estado y llamada externa DEBE registrarse con `sessionId` de correlación (Principio V).
- **RNF-04 (Seguridad):** las claves de terceros solo por variables de entorno; nunca registrar audio crudo ni tokens (Principios IV, VII).
- **RNF-05 (Extensibilidad de auth):** DEBE existir un punto de extensión para insertar Better Auth sin refactorizar controladores (Principio VII).
- **RNF-06 (Portabilidad de proveedores):** cada proveedor externo detrás de un adapter reemplazable (Principio IV).

## 7. Contratos de la API (nivel funcional)

> El detalle técnico (payloads, esquemas, eventos WS) se define en `plan.md`. Aquí solo la intención.

| Endpoint | Intención |
|----------|-----------|
| `POST /interview/start` | Crea la sesión, pide preguntas a N8N, devuelve `sessionId`. |
| `POST /interview/message` | Recibe audio del usuario, transcribe, genera y devuelve la réplica hablada. |
| `POST /interview/end` | Finaliza la sesión y dispara el reporte en N8N. |
| `POST /schedule` | Agenda una sesión futura y notifica a N8N. |
| `WS  /interview/:sessionId` | Canal de tiempo real para el turno conversacional. |

**Flujos N8N asociados** (fuente: `project-flow.md`, `frontend/docs/N8N-TABLE-ALIGNMENT.md`):

- `/generate-interview` — al iniciar: genera preguntas base + follow-ups y crea la sesión (entrada = `recibe.json`, salida = `{ sessionId, questions[] }`).
- `/final-report` — al finalizar: evaluación profunda que escribe `evaluations` (salida = `InterviewReport`, ver `respuesta.json`).

## 8. Máquina de estados de la sesión

```
created ──▶ running ──▶ ending ──▶ completed
              │  ▲
              ▼  │
           stress (subestado de running)
```

- `created`: sesión persistida, preguntas solicitadas a N8N.
- `running`: entrevista en curso, aceptando turnos.
- `stress`: subestado activo cuando el modo estrés escala (solo afecta el comportamiento, no bloquea turnos).
- `ending`: se solicitó cierre; se dispara N8N.
- `completed`: terminada; no acepta más turnos.

## 9. Modelo de datos (conceptual)

Entidades mínimas (nombres físicos alineados con `frontend/prisma/schema.prisma`; detalle en el plan):

- **interview_sessions** — configuración (`interview_type`, `role`, `level`, `stack`, `extra_context`, `stress_mode`), `status`, timestamps.
- **questions** — preguntas y follow-ups (`question_text`, `order_index`, `is_followup`, `parent_question_id`).
- **responses** — respuesta del usuario (`response_text` transcrito + `audio_url`) y **señales de estrés persistidas** (`long_pause_detected`, `filler_words_detected`, `confidence_flag`).
- **recordings** — referencias a audios (`type` `ai`/`user`, `reference_id`, `audio_url`, `duration_seconds`) para reproducción de sesión.
- **evaluations** — la escribe N8N; el backend solo la lee (`score_global`, `score_clarity`, `score_knowledge`, `score_confidence`, `score_structure`, `strengths`, `weaknesses`, `recommendation`).
- **schedules** — sesiones agendadas (`scheduled_at`, flags de recordatorio email/WhatsApp).
- **webhook_logs** — auditoría de llamadas a N8N (`flow_name`, `endpoint`, payloads, `status`) — apoya la observabilidad (P-V).

> Las tablas de autenticación de Better Auth (`user`, `session`, `account`, `verification`) quedan **fuera del alcance** del backend en el MVP (endpoints públicos, P-VII). Nota: la tabla de login `session` es distinta de `interview_sessions`.

## 10. Criterios de aceptación

- **CA-01** Dado un usuario que envía una configuración válida a `/interview/start`, cuando el flujo se completa, entonces recibe un `sessionId` y la sesión queda en estado `running` (o `created` con degradación si N8N falla).
- **CA-02** Dado un audio de respuesta del usuario, cuando se envía por el canal en vivo, entonces el sistema devuelve una réplica coherente en texto **y** audio en un tiempo conversacional.
- **CA-03** Dado el modo estrés activo y una respuesta con señales de inseguridad, cuando el sistema procesa el turno, entonces el tono del entrevistador escala de forma perceptible.
- **CA-04** Dado que la entrevista finaliza, cuando se llama a `/interview/end`, entonces la sesión pasa a `completed` y se dispara el flujo de reporte en N8N.
- **CA-05** Dado un fallo de ElevenLabs, cuando ocurre durante un turno, entonces el sistema devuelve al menos la réplica en texto y registra el incidente, sin cerrar la sesión.
- **CA-06** Dada una sesión finalizada, cuando se consultan sus intercambios, entonces existen registros ordenados suficientes para reproducir la entrevista.

## 11. Suposiciones

- El frontend gestiona la captura/reproducción de audio y el manejo del micrófono.
- N8N expone webhooks estables para generación de preguntas y reporte final.
- Supabase está disponible como capa de persistencia.
- En el MVP no hay autenticación: cualquier cliente puede consumir los endpoints.

## 12. Preguntas abiertas (para fase Clarify)

- **[NECESITA ACLARACIÓN]** ¿El audio del usuario se envía por WebSocket (streaming) o por HTTP multipart en `/interview/message`?
- **[NECESITA ACLARACIÓN]** ¿Los audios se almacenan en Supabase Storage o en otro bucket/CDN?
- **[NECESITA ACLARACIÓN]** ¿Umbrales concretos para "silencio largo" y "respuesta débil" en el modo estrés?
- **[NECESITA ACLARACIÓN]** ¿Objetivo numérico de latencia máxima aceptable por turno?
- **[NECESITA ACLARACIÓN]** ¿Set de preguntas de respaldo (RF-04) fijo o generado localmente por el AI Engine?
- **[NECESITA ACLARACIÓN — divergencia con lo implementado]** `project-flow.md` asigna `POST /interview/start` al **backend** (que llama a N8N), pero el frontend ya implementó `POST /api/interview/start` en Next.js llamando a N8N y ElevenLabs directamente y sincronizando Prisma (`frontend/src/app/api/interview/start/route.ts`). Hay que decidir el dueño canónico de `start`: (a) el backend NestJS lo posee y el frontend lo consume, o (b) el frontend conserva `start` (generación inicial) y el backend se limita al turno en vivo (`/interview/message`, WS) y al cierre (`/interview/end`). Esto contradice el principio "el frontend no habla con N8N" del propio `project-flow.md`.
- **[NECESITA ACLARACIÓN]** Vocabulario de `status`: el modelo Prisma usa `pending` por defecto; la máquina de estados de la spec usa `created → running → ending → completed`. Definir el mapeo (¿`pending` = `created`?).
- **[NECESITA ACLARACIÓN]** El STT del proyecto: `project-overview.md`/`project-flow.md` aún mencionan **Whisper**, pero la constitución del backend (v1.1.0) ya decidió **ElevenLabs Scribe**. Confirmar la fuente de verdad (la constitución prevalece salvo enmienda de esos documentos raíz).

## 13. Dependencias

- Spec 002 — Integraciones N8N (webhooks de generación y reporte). *(pendiente)*
- Constitución v1.2.0.
- Contratos ya materializados (fuente de verdad transversal): `frontend/prisma/schema.prisma` (modelo de datos), `recibe.json` (payload N8N generate), `respuesta.json` (`InterviewReport`), `frontend/docs/{INTERVIEW-FLOW.md, N8N-TABLE-ALIGNMENT.md}`, `project-flow.md`.
