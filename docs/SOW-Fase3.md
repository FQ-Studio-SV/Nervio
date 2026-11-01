# Statement of Work (SOW) — Nervio · Fase 3 (Implementación y Despliegue del MVP, Sprint 1)

| Campo | Detalle |
|-------|---------|
| **Proyecto** | Nervio — Simulador de entrevistas con IA y voz en tiempo real |
| **Asignatura** | Aplicación de Técnicas de Ingeniería de Software — Grupo 01 |
| **Docente / Cliente** | Ing. Silvia Janeth Rico de Serrano |
| **Fase** | 3 — Implementación y Despliegue del MVP (Sprint 1) |
| **Fecha** | 31 de octubre de 2026 |
| **Versión** | 1.0 |
| **Estado** | Entregables técnicos centrales completos; brechas acotadas pendientes (ver §6) |

---

## 1. Propósito

Formalizar el alcance de trabajo para **cerrar la Fase 3** de Nervio: consolidar el incremento de
software funcional y ejecutable (MVP) alineado con la arquitectura y los prototipos de la Fase 2, y
definir con precisión el **trabajo pendiente** para alcanzar el 100 % de cumplimiento de la guía
*Actividad Fase 3: Implementación y Despliegue del MVP (Sprint 1)*.

## 2. Alcance (in-scope)

- Acceso seguro: registro e inicio de sesión del candidato.
- Configuración y arranque de la entrevista; sesión persistente.
- Entrevista conversacional por voz en tiempo real (WebSocket con ElevenLabs).
- Generación y consulta de reporte de desempeño; historial.
- Agendamiento de sesiones con recordatorios por correo.
- Artefactos de entrega: código, migraciones (DDL), **seed**, **README**, **colección de API** y
  el **informe de Fase 3** (documento).
- Cierre de brechas descritas en §6.

## 3. Fuera de alcance (out-of-scope)

- Pruebas **automatizadas** (unitarias, integración, E2E, BDD) → corresponden a la **Fase 4**.
- Carga y extracción de CV (funcionalidad futura, CU-11).
- Integraciones de notificación por WhatsApp (solo campo previsto en el modelo).
- Panel administrativo / gestión multi-rol avanzada.

## 4. Entregables de esta entrega (completados)

| ID | Entregable | Ubicación | Estado |
|----|-----------|-----------|--------|
| E1 | Informe de Fase 3 (documento) | `Actividad_evaluada_Fase3_Nervio.docx` | ✅ |
| E2 | README con prereqs, instalación, env, DB+seed y despliegue | `frontend/README.md`, `README.md` | ✅ |
| E3 | Datos de prueba (seed idempotente) | `frontend/prisma/seed.ts` + scripts `db:*` | ✅ |
| E4 | Colección de pruebas manuales de API | `nervio-api.postman_collection.json` | ✅ |
| E5 | Migraciones / DDL ejecutables | `frontend/prisma/migrations/` | ✅ |
| E6 | Diagramas (arquitectura, componentes, ER, despliegue) | Integrados en E1 | ✅ |

## 5. Estado de cumplimiento frente a la guía

| Requisito de la guía | Estado |
|----------------------|--------|
| Repo: historial distribuido | ✅ Cumple |
| Repo: README completo (prereqs, install, env, DB+seeds) | ✅ Cumple |
| Repo: estrategia de ramas `main/develop/feature/*` | ⚠️ Parcial (sin `develop`/`feature`) |
| Backend: arquitectura y endpoints núcleo | ✅ Cumple |
| Backend: hashing + sesiones | ✅ Cumple |
| Backend: control de acceso por **roles/permisos** | ⚠️ Parcial (solo por propiedad `userId`) |
| Backend: manejo de errores + WebSockets | ✅ Cumple |
| BD: migraciones/DDL + integridad | ✅ Cumple |
| BD: seeds (usuarios) | ✅ Cumple |
| Frontend: pantallas MVP + estados + integración | ✅ Cumple |
| Colección de pruebas de API | ✅ Cumple |
| Demostración en vivo | ⏳ Pendiente (presencial; requiere claves ElevenLabs) |

> Observación de consistencia: la documentación (N_3/N_4) declara **NER-8 Recuperación de contraseña**
> dentro del Sprint 1, pero **no está implementada** en el código. Debe cerrarse o retirarse del alcance.

## 6. Trabajo pendiente (paquetes de trabajo)

### WP1 — Recuperación de contraseña (NER-8)
- **Descripción:** habilitar el flujo de *forgot/reset* de contraseña.
- **Tareas:** configurar `sendResetPassword`/verificación de correo en `src/lib/auth.ts` (Better Auth) +
  proveedor de correo (Resend); páginas `/forgot-password` y `/reset-password`; token de un solo uso con expiración.
- **Criterio de aceptación:** un usuario solicita el enlace, define nueva contraseña, el token caduca y se
  invalidan sesiones previas; respuesta uniforme aunque el correo no exista (anti-enumeración, OWASP).
- **Responsable sugerido:** Backend + Frontend · **Estimación:** 1–1.5 días.

### WP2 — Decisión de control de acceso por roles/permisos
- **Descripción:** la guía pide "roles o permisos"; Nervio es monorol (candidato) con autorización por propiedad.
- **Tareas (opción A, recomendada):** documentar y justificar el modelo monorol + autorización por propiedad
  (anti-IDOR) como cumplimiento del requisito. **(opción B):** introducir `role` en `user` y un guard por rol.
- **Criterio de aceptación:** justificación aprobada por el docente **o** guard por rol operativo y probado.
- **Responsable sugerido:** PO + Backend · **Estimación:** 0.5 día (A) / 1–2 días (B).

### WP3 — Despliegue público
- **Descripción:** publicar el MVP en una URL accesible.
- **Tareas:** proyecto en Vercel; variables de entorno (`DIRECT_URL`, `POSTGRES_URL`, secretos);
  `prisma migrate deploy` en el pipeline; verificar cron `/api/cron/reminders`; smoke test del flujo núcleo.
- **Criterio de aceptación:** URL pública navegable con registro, login y configuración de entrevista funcionando.
- **Responsable sugerido:** DBA/DevOps + Backend · **Estimación:** 0.5–1 día.

### WP4 — Preparación de la demo (voz en tiempo real)
- **Descripción:** habilitar la entrevista por voz para la sustentación.
- **Tareas:** configurar `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `ELEVENLABS_VOICE_ID`; prueba de extremo a
  extremo de una entrevista; guion de demo con los casos de uso principales.
- **Criterio de aceptación:** una entrevista por voz completa de principio a fin en el entorno de demo.
- **Responsable sugerido:** Equipo · **Estimación:** 0.5 día.

### WP5 — Estrategia de ramas (opcional, si lo exige la rúbrica)
- **Descripción:** adoptar `main` + `develop` + `feature/*`.
- **Tareas:** crear `develop`; política de PR hacia `develop` y release a `main`; documentar en README.
- **Criterio de aceptación:** convención visible en el repo y documentada.
- **Responsable sugerido:** SM · **Estimación:** 0.25 día.

## 7. Cronograma / hitos

| Hito | Contenido | Fecha objetivo |
|------|-----------|----------------|
| H1 | WP1 (recuperación de contraseña) | +2 días |
| H2 | WP2 (decisión de roles) + WP5 (ramas) | +2 días |
| H3 | WP3 (despliegue público) | +3 días |
| H4 | WP4 (demo lista) + ensayo de sustentación | +3 días |

*(Fechas relativas a la fecha de aprobación de este SOW.)*

## 8. Criterios de aceptación globales

1. Los 6 requisitos obligatorios de la guía en estado ✅ o justificados formalmente.
2. `pnpm install && pnpm db:migrate && pnpm db:seed && pnpm dev` ejecuta el flujo núcleo sin errores.
3. La colección de API responde con códigos HTTP semánticos en todos los endpoints.
4. MVP desplegado en una URL pública y demo por voz reproducible.
5. Consistencia documentación ↔ código (sin funcionalidades declaradas y no implementadas).

## 9. Supuestos y dependencias

- Disponibilidad de una base de datos PostgreSQL (Supabase) y de credenciales de ElevenLabs y Resend.
- Acceso de despliegue a Vercel.
- La evaluación de pruebas automatizadas se difiere a la Fase 4.

## 10. Roles y responsabilidades

| Rol | Integrante |
|-----|-----------|
| Product Owner | Ronald Eduardo Mejía Reinosa |
| Scrum Master | Jesús Gerardo Esquivel Ramírez |
| Backend | Grecia Michelle Cornejo Raymundo |
| Frontend / QA | Melanie Adriana Cruz García |
| Frontend | Fátima Sarahi Coreas Hernández |
| DBA / QA | Oscar Alejandro Orellana Morán |

## 11. Aprobaciones

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Product Owner | | | |
| Scrum Master | | | |
| Docente | Ing. Silvia Janeth Rico de Serrano | | |
