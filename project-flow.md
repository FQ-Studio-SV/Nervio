🧠 Nervio — Arquitectura Completa (App + Backend + N8N)
📌 Visión General
Nervio es un sistema distribuido dividido en tres capas principales:
Frontend (Next.js) → Interfaz de usuario login con Better Auth + Interaz simulada de una esfera que simule al entrevistador cuando este en la entrevista
Backend (NestJS o Node con express ) → Tiempo real + lógica core, en cuanto a la autenticacion y login ignoralo con endpoints publicos para facilidad de momento
N8N → Automatización, análisis y procesos asincrónicos
🧱 ARQUITECTURA GLOBAL

🎯 FILOSOFÍA DE DISEÑO
⚡ Tiempo real → Backend (NO N8N)
🔄 Procesos pesados / diferidos → N8N
🧠 IA inmediata → Backend
📊 IA analítica → N8N
🟢 1. FRONTEND (Next.js)
🎯 Responsabilidad
Solo UI + captura de interacción
📦 Funciones
🎤 Audio
Captura micrófono
Envía audio al backend
Reproduce audio de respuesta
💬 UI de entrevista
Mostrar preguntas
Mostrar estado de entrevista
Mostrar feedback final
📅 Agendamiento
Formulario de fecha/hora
Enviar al backend
🔁 Reproducción de sesión
Player de audios
Timeline de entrevista
❌ NO hace
No llama directamente a OpenAI
No habla con N8N
No procesa lógica compleja
🔴 2. BACKEND (NestJS / Node con express)
🎯 Responsabilidad
🔥 Núcleo del sistema (tiempo real)
🧠 Módulos principales
1. Interview Engine
Controla flujo de entrevista
Mantiene contexto
Decide siguiente pregunta
2. Voice Engine
Envía texto → ElevenLabs
Devuelve audio
3. AI Engine
Llama a OpenAI
Genera respuestas dinámicas
4. Session Manager
Maneja estado
Guarda progreso parcial
⚡ FLUJO DE ENTREVISTA (TIEMPO REAL)

😈 MODO ESTRÉS
Se evalúa en backend:
Detecta:
silencios largos
respuestas débiles
inseguridad
Acción:
cambia prompt:
más agresivo
más presión
interrupciones simuladas
🔌 ENDPOINTS CLAVE
POST /interview/start

👉 Acción:
Llama a N8N → generar preguntas
Retorna sessionId
POST /interview/message

👉 Acción:
transcribe
genera respuesta
devuelve audio
POST /interview/end

👉 Acción:
dispara flujo en N8N (reporte final)
POST /schedule

👉 Acción:
guarda en DB
notifica a N8N
🔵 3. N8N (AUTOMATIZACIÓN)
🎯 Responsabilidad
🔥 TODO lo que NO es tiempo real
🔄 FLUJOS DETALLADOS
🧾 FLUJO 1 — Generación de Entrevista
Trigger:
Webhook /generate-interview
Input:

Proceso:
OpenAI:
genera preguntas base
genera follow-ups
Supabase:
crea sesión
guarda preguntas
Output:

📊 FLUJO 2 — Evaluación Profunda
Trigger:
Webhook /final-report
Proceso:
Obtiene respuestas desde Supabase
OpenAI:
analiza toda la entrevista
evalúa:
conocimiento
comunicación
seguridad
coherencia
Genera:
score global
fortalezas
debilidades
recomendación
Guarda:
Tabla evaluations
🔊 FLUJO 3 — Feedback hablado
Proceso:
Recibe texto del reporte
ElevenLabs:
genera audio narrado
Guarda URL en DB
💡 Este audio es el “coach final”
📧 FLUJO 4 — Recordatorios
Trigger:
Cron (cada X minutos)
Proceso:
Consulta sesiones próximas
Si faltan X minutos:
Email (Resend)
WhatsApp (Twilio)
📦 FLUJO 5 — Persistencia extendida
Opcional pero potente:
Guardar métricas
Historial de mejora
Comparación entre sesiones
🧠 DIVISIÓN FINAL DE RESPONSABILIDADES
🟢 FRONTEND
UI
audio capture/playback
interacción
🔴 BACKEND
tiempo real
IA conversacional
lógica de entrevista
modo estrés
🔵 N8N
generación inicial
evaluación profunda
reportes
automatización
notificaciones
procesamiento pesado
⚠️ ERRORES QUE DEBEN EVITAR
❌ Usar N8N para conversación❌ Usar frontend para lógica AI❌ No separar responsabilidades
🚀 MVP DEFINIDO
Incluye:
entrevista en tiempo real
3 tipos de entrevistador
modo estrés
evaluación final
feedback hablado
agendamiento + recordatorios
NO incluye:
video
IA ultra personalizada
análisis facial
🧠 RESUMEN FINAL

🎯 FRASE PARA EL EQUIPO
“Nervio separa claramente el tiempo real de la automatización:el backend maneja la entrevista en vivo, mientras N8N procesa, evalúa y optimiza todo en segundo plano.”
🔥 RESULTADO
Sistema escalable
Demo sólida
Arquitectura profesional
Uso REAL de N8N