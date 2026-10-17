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
| Tiempo real | WebSockets (Gateway de NestJS / `ws`) | Baja latencia del turno (P-I, RNF-01). |
| Persistencia | Supabase (Postgres) vía cliente oficial | Restricción de constitución. |
| Validación | DTOs + `class-validator` / `zod` | Contract-first (P-II). |
| Config | `@nestjs/config` + `.env` | Secretos fuera del repo (P-IV, RNF-04). |
| Logging | Logger estructurado (JSON) con `sessionId` | Observabilidad (P-V, RNF-03). |
| Tests | Jest + adapters mockeados | Portabilidad de proveedores (P-IV). |

> **Fallback:** si NestJS resulta excesivo para el MVP, Express con la misma división modular. La spec y los contratos no cambian.

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
├── ai/                         # AI Engine (adapter OpenAI)
│   ├── ai.service.ts
│   ├── prompts/                # plantillas por perfil + escalado estrés
│   └── ai.provider.interface.ts
├── voice/                      # Voice Engine (STT Whisper + TTS ElevenLabs)
│   ├── stt.service.ts
│   ├── tts.service.ts
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

Request:
```json
{
  "type": "hr | technical | stress",
  "role": "Frontend",
  "level": "junior | mid | senior",
  "stack": ["React", "TypeScript"],
  "notes": "texto libre opcional",
  "stressMode": false
}
```
Response `201`:
```json
{
  "sessionId": "uuid",
  "state": "running | created",
  "degraded": false,
  "firstQuestion": { "id": "uuid", "text": "…", "audioUrl": "…" }
}
```

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

## 4. Protocolo WebSocket `WS /interview/:sessionId`

Eventos **cliente → servidor**:
- `user_audio_chunk` — chunk de audio (streaming) del usuario.
- `user_audio_end` — fin del turno del usuario.

Eventos **servidor → cliente**:
- `interviewer_text` — texto de la réplica (se puede mostrar mientras se sintetiza).
- `interviewer_audio` — audio (o URL) de la réplica.
- `state_changed` — nuevo estado / stressLevel.
- `error` — incidente degradado.

> Decisión pendiente de Clarify: streaming por WS vs. multipart HTTP. El plan soporta ambos; WS es el camino preferido para latencia (RNF-01).

## 5. Esquema de datos (Supabase / Postgres)

```
sessions(       id pk, type, role, level, stack jsonb, notes, stress_mode bool,
                state, degraded bool, created_at, updated_at )
questions(      id pk, session_id fk, text, order_index, is_follow_up bool )
responses(      id pk, session_id fk, question_id fk, transcript, audio_ref, created_at )
exchanges(      id pk, session_id fk, order_index, question_id fk, response_id fk,
                interviewer_text, interviewer_audio_ref )
recordings(     id pk, session_id fk, kind 'ai'|'user', audio_ref, created_at )
evaluations(    id pk, session_id fk, ... )   -- la escribe N8N; backend solo lee
schedules(      id pk, config jsonb, scheduled_at, contact jsonb, created_at )
```

## 6. Flujo de un turno (secuencia)

```
Usuario (audio) ─▶ Gateway/Controller
   └─▶ Voice.STT (Whisper)            → transcript
   └─▶ Stress.evaluate(transcript, señales)  → stressLevel (si stressMode)
   └─▶ AI.generateReply(contexto + perfil + stressLevel)  → reply.text + next
   └─▶ Voice.TTS (ElevenLabs, params por perfil)          → reply.audio
   └─▶ Session.persistExchange(...)   → guarda turno + recording
   └─▶ respuesta al cliente (texto + audio + next + stressLevel)
```

## 7. Diseño del modo estrés (`stress/`)

- **Señales de entrada:** duración de silencio previo (del frontend/WS), longitud/confianza de la respuesta, densidad de muletillas (heurística sobre el transcript).
- **`stress.rules.ts`:** acumulador que sube `stressLevel` (0–3) según señales; con umbral configurable por env.
- **Efecto:** el nivel selecciona la variante de prompt en `ai/prompts/` (más presión, interrupciones simuladas) y ajusta params de TTS.
- **[NECESITA ACLARACIÓN]** umbrales concretos → quedan como constantes configurables hasta la fase Clarify.

## 8. Integración con proveedores (adapters)

| Proveedor | Interfaz | Timeout | Reintentos | Degradación |
|-----------|----------|---------|------------|-------------|
| OpenAI | `AiProvider` | sí | backoff | error `PROVIDER_ERROR`, turno reintentable |
| Whisper | `SttProvider` | sí | backoff | pedir reenvío de audio |
| ElevenLabs | `TtsProvider` | sí | 1 reintento | devolver solo texto (RF/CA-05) |
| N8N | `N8nClient` | sí | backoff | set de preguntas de respaldo (RF-04) |
| Supabase | `SessionRepository` | sí | — | fallo duro (persistencia crítica) |

## 9. Configuración (variables de entorno)

```
PORT=
SUPABASE_URL=            SUPABASE_SERVICE_KEY=
OPENAI_API_KEY=          OPENAI_MODEL=
WHISPER_API_KEY=         (o usa OPENAI_API_KEY)
ELEVENLABS_API_KEY=      ELEVENLABS_VOICE_ID_HR=  ..._TECH=  ..._STRESS=
N8N_GENERATE_WEBHOOK_URL=
N8N_REPORT_WEBHOOK_URL=
N8N_SCHEDULE_WEBHOOK_URL=
STRESS_SILENCE_MS=       STRESS_ESCALATION_THRESHOLD=
```
`config/` valida presencia al arrancar; ausencia de una clave crítica aborta el boot (fail-fast).

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
3. **Adapters** (OpenAI, Whisper, ElevenLabs, N8N) tras interfaces.
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
