🧠 Nervio — Simulador de Entrevistas con IA, Voz y Automatización
📌 Descripción General
Nervio es una plataforma de simulación de entrevistas laborales impulsada por IA que permite a los usuarios practicar entrevistas en tiempo real mediante interacción por voz con un entrevistador virtual.
El sistema no solo genera preguntas dinámicas, sino que también:
Escucha y analiza respuestas del usuario
Adapta el comportamiento del entrevistador
Proporciona feedback hablado
Automatiza evaluaciones, reportes y recordatorios
El objetivo es replicar una experiencia lo más cercana posible a una entrevista real.
🎯 Objetivos del Producto
Simular entrevistas realistas con distintos perfiles de entrevistador
Evaluar habilidades técnicas y blandas
Proporcionar retroalimentación inmediata y final
Permitir agendar sesiones de práctica
Automatizar flujos con N8N para escalar el sistema
👥 Tipos de Usuario
Estudiantes
Desarrolladores junior / mid / senior
Profesionales en búsqueda de empleo
🧠 Tipos de Entrevista
HR (amable, conversacional)
Técnico (directo, enfocado en conocimiento)
Agresivo / estrés (interrumpe, presiona, incomoda)
🔁 Flujo General del Sistema
1. Inicio de sesión
Usuario entra a la plataforma y selecciona:
Tipo de entrevista
Rol (Frontend, Backend, etc.)
Nivel (Junior, Mid, Senior)
Stack tecnológico
Textbox para que agregue mas informacion de la entrevista o detalle su necesidad
Opcion de habilitar modo de estres
Opcion para poder reservas
2. Generación de entrevista (N8N)
Trigger: selección del usuario
Flujo:
N8N recibe datos
Llama a OpenAI
Genera:
lista de preguntas
posibles follow-ups
Guarda sesión en base de datos
3. Simulación en tiempo real (CORE)
🗣️ Flujo de interacción
IA hace pregunta (voz con ElevenLabs)
Usuario responde (audio)
Audio → texto (Whisper)
Se analiza respuesta
IA responde dinámicamente
4. Modo Estrés (Feature clave 🔥)
Sistema detecta:
pausas largas
respuestas inseguras
muletillas
Acción:
Cambia el tono del entrevistador automáticamente
Hace preguntas más agresivas
Interrumpe respuestas
5. Evaluación en tiempo real (N8N)
Trigger: respuesta del usuario
Flujo:
Recibe texto
Evalúa con OpenAI:
claridad
conocimiento
seguridad
estructura
Genera score parcial
Genera feedback textual
Convierte feedback a audio (ElevenLabs)
6. Finalización de entrevista
Se genera automáticamente:
Score global
Evaluación por categorías
Fortalezas
Debilidades
Recomendación final (apto / no apto)
7. Reporte final (N8N)
Flujo:
Resume toda la sesión
Genera reporte estructurado
Guarda historial
Opcional:
Envía email
Genera PDF
8. Reproducción de sesión (Feature diferenciador 🎧)
El sistema permite:
Reproducir la entrevista completa como si fuera una llamada
Escuchar:
preguntas
respuestas
feedback
💡 Esto se logra almacenando:
audios generados
audios del usuario
9. Agendamiento de entrevistas (N8N)
El usuario puede agendar una sesión futura.
Flujo:
Usuario selecciona fecha/hora
N8N guarda evento
Se dispara:
Email recordatorio
WhatsApp (opcional)
🔄 Flujos N8N
Flujo 1: Generación de entrevista
Webhook → OpenAI → Supabase
Flujo 2: Evaluación de respuesta
Webhook → OpenAI → ElevenLabs → DB
Flujo 3: Reporte final
DB → OpenAI → Email API
Flujo 4: Recordatorios
Cron → Email / WhatsApp API
🧱 Arquitectura Técnica
Frontend
Next.js
TailwindCSS
Web Audio API
Backend
Node.js / NestJS
WebSockets (para interacción en tiempo real)
Base de datos
Supabase
Tablas sugeridas:
users
sessions
questions
responses
evaluations
recordings
IA
OpenAI (GPT / Codex)
Whisper (speech-to-text)
Voz
ElevenLabs (text-to-speech)
Automatización
N8N
🧠 Lógica de IA
Generación de preguntas
Basadas en:
rol
nivel
stack
Evaluación
No solo correctness
También:
comunicación
confianza
estructura lógica
Adaptabilidad
IA reacciona en tiempo real
Hace follow-ups dinámicos
🎥 Demo ideal
Usuario entra
Selecciona entrevista
Comienza simulación
IA habla
Usuario responde
Modo estrés se activa
Finaliza
Se genera feedback hablado
Usuario reproduce la sesión
🚀 Diferenciadores
Interacción por voz realista
Entrevistas dinámicas (no scripts)
Feedback hablado
Modo estrés automático
Reproducción de sesiones
Uso real de N8N
📈 Alcance MVP
Incluye:
Simulación básica
3 tipos de entrevistador
Evaluación simple
Reporte final
Reproducción de sesión
No incluye (fase futura):
IA ultra personalizada por CV
Matching con trabajos reales
Multilenguaje avanzado
🧩 Posibles mejoras futuras
Integración con LinkedIn
Análisis de lenguaje corporal (video)
Ranking de usuarios
Entrenamiento personalizado
🧠 Conclusión
Nervio no es solo un simulador, es un sistema de entrenamiento profesional automatizado que combina:
IA conversacional
Voz realista
Automatización con N8N
Creando una experiencia inmersiva, útil y altamente demostrable para hackathons.