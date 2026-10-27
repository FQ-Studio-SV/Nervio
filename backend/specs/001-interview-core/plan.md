# 🛠️ Plan Técnico 001 — Interview Core

> **Fase 2 de SDD: Plan.**
> Traduce `spec.md` a decisiones técnicas concretas. Debe respetar `../../.specify/memory/constitution.md`.
> No contiene código de producción; sí contratos, esquemas y estructura.

- **Feature ID:** 001-interview-core
- **Estado:** Borrador
- **Fecha:** 2026-07-04
- **Spec base:** `./spec.md`

---

## 1. Stack técnico

| Área | Decisión | Justificación (principio) |
|------|----------|---------------------------|
| Lenguaje | TypeScript (Node.js LTS) | Tipado fuerte para contratos (P-II). |
| Framework | **NestJS** | Modularidad por dominio nativa (P-III). |
| Tiempo real (entrante) | WebSockets con **`WsAdapter` de NestJS (librería `ws`, no Socket.IO)** | Streaming de audio binario de baja latencia navegador↔backend (P-I, RNF-01). |
| Tiempo real (saliente) | Backend como **cliente `ws`** hacia ElevenLabs (STT/TTS streaming) | Reutiliza una conexión larga por turno; independiente del framework (P-IV). |
| Persistencia | Supabase (Postgres) vía cliente oficial | Restricción de constitución. |
| Validación | DTOs + `class-validator` / `zod` | Contract-first (P-II). |
| Config | `@nestjs/config` + `.env` | Secretos fuera del repo (P-IV, RNF-04). |
| Logging | Logger estructurado (JSON) con `sessionId` | Observabilidad (P-V, RNF-03). |
| Tests | Jest + adapters mockeados | Portabilidad de proveedores (P-IV). |

> **Fallback:** si NestJS resulta excesivo para el MVP, Fastify (`@fastify/websocket`) o Node + Express + `ws` con la misma división modular. La spec y los contratos no cambian.
>
> **Dependencias WS:** `@nestjs/websockets` + `@nestjs/platform-ws` + `ws` (transporte). Se configura `app.useWebSocketAdapter(new WsAdapter(app))` en `main.ts` para descartar Socket.IO.

## 2. Arquitectura de módulos

```
src/
├── main.ts                     # bootstrap
├── app.module.ts
├── common/                     # logger, filtros de error, guards (auth stub)
│   ├── logging/
│   ├── errors/
│   └── auth/                   # AuthGuard no-op (punto de extensión Better Auth)
├── config/                     # carga y validación de env
├── interview/                  # Interview Engine (orquestador)
│   ├── interview.controller.ts # POST /interview/start|message|end
│   ├── interview.gateway.ts    # WS /interview/:sessionId
│   ├── interview.service.ts    # flujo + máquina de estados
│   └── dto/
├── ai/                         # AI Engine (adapter OpenAI GPT → réplicas coherentes)
│   ├── ai.service.ts
│   ├── prompts/                # plantillas ES por perfil (hr, tecnico, no_tecnico, agresivo) + escalado estrés
│   └── ai.provider.interface.ts
├── voice/                      # Voice Engine (STT + TTS, ambos ElevenLabs)
│   ├── stt.service.ts          # ElevenLabs Scribe (audio → texto)
│   ├── tts.service.ts          # ElevenLabs TTS (texto → audio, voz por perfil)
│   └── voice.provider.interface.ts
├── session/                    # Session Manager (estado + persistencia)
│   ├── session.service.ts
│   ├── session.repository.ts   # adapter Supabase
│   └── session.state.ts        # máquina de estados
├── stress/                     # detector de señales + política de escalado
│   ├── stress.service.ts
│   └── stress.rules.ts
├── scheduling/                 # POST /schedule
│   ├── scheduling.controller.ts
│   └── scheduling.service.ts
└── integrations/
    └── n8n/                    # adapter webhooks N8N
        └── n8n.client.ts
```

**Regla de dependencias:** `interview` orquesta y depende de las interfaces de `ai`, `voice`, `session`, `stress`. Los adapters (`n8n`, Supabase, proveedores) están detrás de interfaces (P-IV). Ningún módulo importa detalles internos de otro (P-III).

## 3. Contratos de la API

### 3.1 `POST /interview/start`

Request (alineado con `InterviewSetupInput` del frontend):
```json
{
  "role": "Desarrollador Senior",
  "candidateName": "Juan Pérez",
  "level": "junior | mid | senior",
  "interviewType": "hr | tecnico | no_tecnico | agresivo",
  "stack": "React, Node.js",
  "extraContext": "texto libre con detalle del perfil"
}
```
Response `200/201` (alineado con `StartInterviewResponse`):
```json
{
  "sessionId": "uuid",
  "questions": [
    { "session_id": "uuid", "question_text": "…", "order_index": 1, "is_followup": false, "id": "uuid" }
  ],
  "question": { "text": "…", "order_index": 1, "is_followup": false },
  "audioUrl": "data:audio/mpeg;base64,… | null",
  "degraded": false
}
```

> **Mapeo a N8N (`/generate-interview`):** `candidateName` se pliega dentro de `extra_context` (`"Candidato: <name>\n\n<extraContext>"`); `stress_mode = (interviewType === "agresivo")`; `stack` viaja como cadena. Ver `toN8nGenerateInterviewPayload()` y §3.6.

### 3.2 `POST /interview/message` (fallback HTTP; ver §4 para WS)

Request (`multipart/form-data`): `sessionId` + archivo de audio.
Response `200`:
```json
{
  "transcript": "respuesta transcrita del usuario",
  "reply": { "text": "réplica del entrevistador", "audioUrl": "…" },
  "next": "follow_up | next_question | end",
  "stressLevel": 0
}
```

### 3.3 `POST /interview/end`

Request: `{ "sessionId": "uuid" }` → Response `200`: `{ "state": "completed", "reportQueued": true }`

El reporte lo produce N8N (`/final-report`) de forma asíncrona y se escribe en `evaluations`. Su lectura (forma `InterviewReport`) se detalla en §3.6.

### 3.4 `POST /schedule`

Request:
```json
{ "config": { "...igual que start..." }, "scheduledAt": "ISO-8601", "contact": { "email": "…" } }
```
Response `201`: `{ "scheduleId": "uuid", "notified": true }`

### 3.5 Errores (formato uniforme)

```json
{ "error": { "code": "PROVIDER_TIMEOUT", "message": "…", "sessionId": "uuid" } }
```
Códigos base: `VALIDATION_ERROR`, `SESSION_NOT_FOUND`, `SESSION_COMPLETED`, `PROVIDER_TIMEOUT`, `PROVIDER_ERROR`, `DEGRADED`.

### 3.6 Contratos N8N (webhooks)

**`/generate-interview`** — entrada (ver `recibe.json`):
```json
{
  "user_id": "uuid",
  "interview_type": "hr | tecnico | no_tecnico | agresivo",
  "role": "Desarrollador Senior",
  "level": "junior | mid | senior",
  "stack": "React, Node.js",
  "extra_context": "Candidato: Juan Pérez\n\n…",
  "stress_mode": false
}
```
Salida:
```json
{ "sessionId": "uuid", "questions": [ { "session_id": "uuid", "question_text": "…", "order_index": 1, "is_followup": false } ] }
```

**`/final-report`** — salida `InterviewReport` (ver `respuesta.json`), reflejo de `evaluations`:
```json
{
  "sessionId": "uuid",
  "scoreGlobal": 82, "scoreClarity": 85, "scoreKnowledge": 88,
  "scoreConfidence": 78, "scoreStructure": 80,
  "strengths": ["…"], "weaknesses": ["…"],
  "recommendation": "…",
  "interviewType": "tecnico", "role": "Desarrollador Senior", "candidateName": "Juan Pérez"
}
```

> **Alineación de tablas (N8N ↔ Prisma):** el workflow debe escribir en `interview_sessions` (no `sessions`). Ver `frontend/docs/N8N-TABLE-ALIGNMENT.md`.

## 4. Protocolo WebSocket `WS /interview/:sessionId`

> **Transporte:** WebSocket nativo (`ws`) vía `WsAdapter` de NestJS. **No** Socket.IO (evita overhead y facilita frames binarios de audio). Los frames de audio viajan como binario; los eventos de control como JSON de texto.

Eventos **cliente → servidor**:
- `user_audio_chunk` — chunk de audio (streaming) del usuario.
- `user_audio_end` — fin del turno del usuario.

Eventos **servidor → cliente**:
- `interviewer_text` — texto de la réplica (se puede mostrar mientras se sintetiza).
- `interviewer_audio` — audio (o URL) de la réplica.
- `state_changed` — nuevo estado / stressLevel.
- `error` — incidente degradado.

> Decisión pendiente de Clarify: streaming por WS vs. multipart HTTP. El plan soporta ambos; WS es el camino preferido para latencia (RNF-01).

### 4.1 Conexiones WS salientes a ElevenLabs (Voice Engine, cliente `ws`)

El Voice Engine abre conexiones WS **como cliente** hacia ElevenLabs por turno/sesión:

- **STT (Scribe v2 Realtime):** `wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=scribe_v2_realtime`
  - Se envían mensajes `{"message_type":"input_audio_chunk","audio_base_64":"…","sample_rate":16000}` y un `{"message_type":"commit"}` al cerrar el turno.
  - Recibe transcripciones **parciales** (interim) y **committed**; audio requerido: PCM 16-bit, 16 kHz mono, chunks ~32 KB/seg.
- **TTS (streaming):** `wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input?model_id={ttsModel}`
  - Se envían chunks de texto conforme los emite el LLM; `chunk_length_schedule` / `flush:true` controlan el trade-off latencia/prosodia.
  - Devuelve audio progresivo que se reenvía al cliente (`interviewer_audio`).

> Autenticación: la API key va en cabecera del handshake WS desde el backend (nunca expuesta al navegador). Si en el futuro se transcribe desde el cliente, se emitiría un *single-use token* generado en el backend.

## 5. Esquema de datos (Supabase / Postgres)

> **Fuente de verdad:** `frontend/prisma/schema.prisma` (ya migrado, `20260704213008_init`). El backend consume estas tablas vía su adapter; los nombres físicos son snake_case.

```
interview_sessions( id uuid pk, user_id, interview_type, role, level, stack,
                    extra_context, stress_mode bool, status default 'pending',
                    started_at, ended_at, created_at )
questions(          id uuid pk, session_id fk, question_text, order_index,
                    is_followup bool, parent_question_id self-fk, created_at )
responses(          id uuid pk, session_id fk, question_id fk, response_text, audio_url,
                    long_pause_detected bool, filler_words_detected bool,
                    confidence_flag, created_at )         -- señales de estrés persistidas
recordings(         id uuid pk, session_id fk, type 'ai'|'user', reference_id,
                    audio_url, duration_seconds, created_at )
evaluations(        id uuid pk, session_id unique fk, score_global, score_clarity,
                    score_knowledge, score_confidence, score_structure,
                    strengths, weaknesses, recommendation, created_at )  -- la escribe N8N; backend lee
schedules(          id uuid pk, session_id fk, user_id, scheduled_at,
                    reminder_email_sent bool, reminder_whatsapp_sent bool, created_at )
webhook_logs(       id uuid pk, session_id fk, flow_name, endpoint,
                    request_payload jsonb, response_payload jsonb, status, error_message, created_at )
```

> Cambios frente al borrador previo: `sessions`→`interview_sessions`; se elimina `exchanges` (la reproducción se reconstruye con `questions` + `responses` + `recordings.reference_id`); las señales de estrés se persisten en `responses`; se añade `webhook_logs` para auditar N8N (P-V). Better Auth (`user`, `session`, `account`, `verification`) queda fuera del alcance del backend (MVP público).

## 6. Flujo de un turno (secuencia)

```
Usuario (audio) ─▶ Gateway/Controller
   └─▶ Voice.STT (ElevenLabs Scribe)  → transcript
   └─▶ Stress.evaluate(transcript, señales)  → stressLevel (si stressMode)
   └─▶ AI.generateReply(contexto + perfil + stressLevel)  → reply.text + next   # OpenAI GPT
   └─▶ Voice.TTS (ElevenLabs, params por perfil)          → reply.audio
   └─▶ Session.persistExchange(...)   → guarda turno + recording
   └─▶ respuesta al cliente (texto + audio + next + stressLevel)
```

## 7. Diseño del modo estrés (`stress/`)

- **Señales de entrada:** duración de silencio previo (del frontend/WS), longitud/confianza de la respuesta, densidad de muletillas (heurística sobre el transcript).
- **Persistencia:** las señales se guardan por respuesta en `responses` (`long_pause_detected`, `filler_words_detected`, `confidence_flag`) para que N8N las use en la evaluación profunda.
- **`stress.rules.ts`:** acumulador que sube `stressLevel` (0–3) según señales; con umbral configurable por env.
- **Efecto:** el nivel selecciona la variante de prompt en `ai/prompts/` (más presión, interrupciones simuladas) y ajusta params de TTS.
- **[NECESITA ACLARACIÓN]** umbrales concretos → quedan como constantes configurables hasta la fase Clarify.

## 8. Integración con proveedores (adapters)

| Proveedor | Interfaz | Timeout | Reintentos | Degradación |
|-----------|----------|---------|------------|-------------|
| OpenAI GPT | `AiProvider` | sí | backoff | error `PROVIDER_ERROR`, turno reintentable |
| ElevenLabs STT (Scribe v2 Realtime, WS) | `SttProvider` | sí | backoff / reconexión WS | pedir reenvío de audio |
| ElevenLabs TTS (stream-input, WS) | `TtsProvider` | sí | 1 reintento / reconexión WS | devolver solo texto (RF/CA-05) |
| N8N | `N8nClient` | sí | backoff | set de preguntas de respaldo (RF-04) |
| Supabase | `SessionRepository` | sí | — | fallo duro (persistencia crítica) |

> **N8N:** flujos `/generate-interview` (inicio) y `/final-report` (cierre). Cada llamada se audita en `webhook_logs` (`flow_name`, `endpoint`, payloads, `status`, `error_message`) para observabilidad (P-V).

## 9. Configuración (variables de entorno)

```
PORT=
# Supabase / Postgres (mismo proyecto que usa Prisma en el frontend)
SUPABASE_URL=            SUPABASE_SERVICE_KEY=
DATABASE_URL=            (pooler pgbouncer :6543 — runtime)
DIRECT_URL=              (conexión directa :5432 — migraciones)
# OpenAI GPT
OPENAI_API_KEY=          OPENAI_MODEL=
# ElevenLabs (voz)
ELEVENLABS_API_KEY=
ELEVENLABS_STT_MODEL=    (p. ej. scribe_v2_realtime)
ELEVENLABS_TTS_MODEL=    (p. ej. eleven_multilingual_v2 — español; o eleven_flash_v2_5 baja latencia)
ELEVENLABS_VOICE_ID_HR=  ELEVENLABS_VOICE_ID_TECH=  ELEVENLABS_VOICE_ID_NOTECH=  ELEVENLABS_VOICE_ID_STRESS=
# N8N (nombres alineados con frontend/.env.example)
N8N_WEBHOOK_GENERATE_INTERVIEW_URL=
N8N_WEBHOOK_FINAL_REPORT_URL=
N8N_WEBHOOK_SCHEDULE_URL=
# Modo estrés
STRESS_SILENCE_MS=       STRESS_ESCALATION_THRESHOLD=
```
`config/` valida presencia al arrancar; ausencia de una clave crítica aborta el boot (fail-fast).

> **Notas de alineación:** el frontend usa hoy un único `ELEVENLABS_VOICE_ID` y el modelo REST `eleven_multilingual_v2` (buena cobertura de español) para el audio de la primera pregunta; el backend define voz por perfil para el turno en vivo. Como el producto es en **español**, el modelo TTS elegido DEBE soportar español y los prompts del `ai/` van en español.

## 10. Autenticación (punto de extensión)

- `common/auth/AuthGuard` implementado como **no-op** en el MVP (deja pasar todo).
- Los controladores lo declaran; activar Better Auth = cambiar la implementación del guard, **sin tocar controladores** (P-VII, RNF-05).

## 11. Observabilidad

- Middleware de logging que inyecta `sessionId` en cada log del turno.
- Log en cada transición de estado y en cada llamada externa (inicio/fin/latencia/resultado).
- Nunca loguear audio crudo ni API keys (RNF-04).

## 12. Estrategia de pruebas

- **Unit:** `stress.rules`, máquina de estados, selección de prompt por perfil.
- **Adapter contract tests:** con proveedores mockeados.
- **Integración:** flujo `start → message → end` con todos los adapters mockeados.
- **Criterios de aceptación** de la spec (CA-01…CA-06) mapeados a tests e2e.

## 13. Fases de implementación (resumen; el desglose fino va en `tasks.md`)

1. **Scaffold** NestJS + config + logging + AuthGuard no-op.
2. **Session Manager** + esquema Supabase + máquina de estados.
3. **Adapters** (OpenAI GPT, ElevenLabs STT/Scribe, ElevenLabs TTS, N8N) tras interfaces.
4. **Interview Engine** (`/start`, `/end`) con integración N8N + fallback.
5. **Turno en tiempo real** (WS + `/message`) uniendo STT→AI→TTS→persistencia.
6. **Modo estrés** (`stress/`).
7. **Scheduling** (`/schedule`).
8. **Tests + observabilidad** de extremo a extremo.

## 14. Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Latencia acumulada STT+LLM+TTS | UX no conversacional | streaming WS, TTS por chunks, modelo rápido |
| Caída de proveedor externo | sesión rota | degradación por adapter (§8, P-VI) |
| Prompt injection vía respuesta del usuario | comportamiento indebido de la IA | sanitizar contexto, plantillas fijas |
| Coste de tokens/audio | presupuesto | límites por sesión, modelos económicos |

## 15. Alineación con la constitución

| Principio | Cómo lo cumple el plan |
|-----------|------------------------|
| I real-time vs async | turno en backend/WS; reporte y preguntas en N8N |
| II contract-first | §3/§4 contratos antes que código |
| III modular | §2 módulos por dominio |
| IV adapters | §8 proveedores tras interfaz |
| V estado observable | §5 máquina de estados + §11 logs |
| VI resiliencia | §8 timeouts/reintentos/degradación |
| VII auth pospuesta | §10 guard no-op |
| VIII MVP simple | §13 fases mínimas, sin extras |
