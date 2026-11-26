# Portal admin v2 — auditoría (solo lectura) y diseño propuesto
Fecha: 2026-11-26 · Estado: **PROPUESTA, sin código; espera el visto bueno de Mario** · Rama: `admin-v2` (no desplegada)
Pendientes maestros: D8 (portal admin) y A8 (avisos de Portfolio) en `/root/store-productos/docs/PENDIENTES-MAESTRO.md`.

## 1. Qué existe hoy
- `/admin` (`src/admin/AdminApp.tsx` 165 líneas + `useMetrics.ts`): login Google (Supabase Auth) limitado a un correo (RLS `auth.jwt()->>'email'`), 7 KPIs (visitas 30 d, únicos, demos, tiempo medio, leads, respuestas, contactos), visitas por día (14 d) y 4 tablas (visitas, respuestas, contactos, leads de `outreach_log`). Solo lectura, sin filtros, sin refresco, sin avisos.
- Datos en el Supabase `ujpscasplurkdcsryjme` (compartido con outreach-tracker), tablas `pf_*` (`supabase/portfolio_admin.sql`). El navegador escribe con la anon key por REST (`src/lib/analytics.ts`); nadie lee desde fuera salvo el owner.
- Captura: visitas (`trackPageview`), demos IA (`trackDemo` + `reportDemoFailure` → flujo n8n «⚠️ Fallos de demos…»), contacto (EmailJS + espejo `saveContactMessage`), widget de WhatsApp = enlace `wa.me` (no captura nada), reseñas (`ReviewWidget`, API propia), GA4/Clarity opcionales.

## 2. Hallazgos de la auditoría (con evidencia)
| # | Hallazgo | Evidencia |
|---|---|---|
| H1 | **Las visitas NUNCA se han registrado** (`pf_page_views` = 0 filas). Causa raíz: `trackPageview` hace `POST` con `Prefer: return=representation`; en Postgres un INSERT que devuelve la fila exige también política SELECT y `anon` no tiene (a propósito). | Probado 26-nov con la anon key del bundle de producción: `401 {"code":"42501","message":"new row violates row-level security policy for table \"pf_page_views\""}` (no se creó fila). El bundle sí lleva la URL de Supabase y la CSP sí permite `*.supabase.co`. |
| H2 | Aunque se arreglara el INSERT, la **duración** (PATCH) tampoco funcionaría por el mismo motivo (UPDATE necesita ver la fila). | Lectura de `analytics.ts` (PATCH `pf_page_views?id=eq…` con anon) + política RLS. |
| H3 | Demos: 16 filas, la última el 27-oct. Contactos 0, respuestas 0, eventos de scraping 0 (`pf_*`); `outreach_log` 32. | Conteos con service_role (solo lectura). |
| H4 | Contacto: EmailJS y espejo a `pf_contact_messages` con 0 filas → hay que comprobar si nadie escribió o si el espejo falla. | Código `ContactForm.tsx`; sin datos para distinguirlo. |
| H5 | El «ChatBot Portfolio» (`/webhook/bot-portfolio`) y «Portfolio Consultation Scheduling» están activos con **0 ejecuciones**; «Fallos de demos reportados por visitantes» también 0. | BD de n8n, solo lectura. |
| H6 | **Desde el VPS no hay forma de ejecutar SQL (DDL)** en ese Supabase (solo URL + service_role por REST; no hay cadena de conexión ni token de gestión en uso). Cualquier cambio de políticas/funciones/Realtime requeriría que Mario lo pegue en el editor SQL de Supabase. | Inventario de `/root/.secrets`. |
| H7 | El portal es un único archivo de 165 líneas con estilos en línea; sin filtros, sin comparativas, sin alertas, sin estados de mensaje editables (no hay política UPDATE para el owner). | Lectura de código. |

## 3. Diseño propuesto
### Principio
Sin IA, sin gasto, mínimo de piezas nuevas; datos en el Supabase actual; el aviso a Telegram y el dashboard salen de los MISMOS eventos.

### Arquitectura recomendada: «colector + API admin» en el VPS (no requiere DDL)
- Servicio `portfolio-api` (Python stdlib, systemd, junto al avisador): 
  - `POST /t/*` (público, con límite por IP y filtro de bots): visita, duración, demo, fallo de demo, clic en WhatsApp, reseña, contacto. Inserta en `pf_*` con la **service_role** (así RLS puede seguir cerrado y se arregla H1/H2), añade país (`CF-IPCountry` de Cloudflare), dispositivo y UTM, y emite el evento al **avisador** (tema 🌐 Portfolio).
  - `GET/PATCH /admin/*` (solo con JWT de Supabase del owner, verificado): KPIs agregados, series, bandeja de mensajes con estados (nuevo/leído/archivado), exportar CSV.
- Exposición: subdominio por Traefik/Cloudflare (mismo patrón que `avisos.mariomoreno.work`); cambio mínimo de CSP `connect-src` en el `Caddyfile` del portfolio.
- Frontend `/admin` v2 (rama `admin-v2`): mismo login y permisos; módulos con carga diferida; **refresco automático cada 15–30 s** (sondeo; Realtime de Supabase exigiría DDL).
- Alternativa B (más simple, pero exige una acción de Mario): pegar un SQL en Supabase (funciones `SECURITY DEFINER` para registrar visitas y políticas de lectura/edición para el owner) y dejar todo en el navegador, sin servicio nuevo. Pierde: país por Cloudflare, anti-bots, avisos integrados y rate-limit del lado servidor.

### Secciones del dashboard
1. **Resumen**: KPIs con variación vs periodo anterior (24 h / 7 d / 30 d / 90 d, rango propio): visitas, únicos, nuevos vs recurrentes, tiempo medio, tasa de rebote, demos usados, **conversión** (visita→demo→contacto), mensajes sin leer, alertas abiertas.
2. **Tráfico**: serie por día y por hora, países, páginas/secciones, fuentes (referrer/UTM), dispositivo/navegador, visitantes en vivo (últimos 5 min).
3. **Demos IA**: usos por demo, tasa de fallos y 429, últimos inputs (recortados), fallos reportados por visitantes.
4. **Contactos y mensajes**: bandeja con estado, búsqueda, exportar; clics en WhatsApp; reseñas.
5. **Captación**: leads/`outreach_log`, respuestas, enlace a Campaña (solo lectura, fase posterior).
6. **Salud**: estado del sitio y de las demos (lo que ya mide `monitor-store` y el smoke de las 13:00 UTC), últimos eventos del avisador, errores recientes.
7. **Avisos (Telegram)**: qué reglas están activas y registro de los últimos eventos enviados.

### Avisos a Telegram (tema 🌐 Portfolio, vía avisador)
- Inmediatos: mensaje de contacto (✉️, sin teléfono ni correo completos), reseña nueva (✉️), clic/mensaje de WhatsApp (ℹ️ agrupado), demo que falla a un visitante (🔴, ya existe por n8n; se unifica), pico de tráfico (≥ N visitas/h, ℹ️), visita desde un lead de campaña (👤).
- Resumen diario (12:00 UTC, ya existe el mecanismo): visitas, demos, mensajes, errores de las últimas 24 h.
- Contrato y estado se registran en `NOTIFICACIONES.md` (§3, fila Portfolio).

## 4. Plan por fases (cada fase se verifica antes de la siguiente)
0. **Arreglar la captura** (colector, H1/H2) — sin esto el dashboard muestra ceros. Prueba: visita real → fila en `pf_page_views` con duración.
1. **Avisos** (A8-Portfolio): contacto, reseñas, WhatsApp, fallos de demo, resumen diario. Prueba: un aviso real de cada tipo en el tema 🌐 Portfolio.
2. **API admin + dashboard v2** (secciones 1–4 primero; 5–7 después). Pruebas: unitarias del API y de agregados; verificación visual con navegador; datos reales.
3. **Despliegue** (necesita el «sí» de Mario: push a `main` = deploy del portfolio y alta del subdominio) + verificación de extremo a extremo + doc de traspaso.

## 4b. Estado de la fase 0 (26-nov, tarde)
**Decisiones de Mario (26-nov):** colector en el VPS (no SQL manual), subdominio `t.mariomoreno.work`, sin guardar IP.
- ✅ **Colector** `ops/collector/collector.py` (stdlib, 8 pruebas unitarias OK) instalado como `portfolio-collector.service` desde `/opt/portfolio-collector/` (`ops/collector/install.sh` copia y reinicia; no depende de la rama de `/root/portfolio`). Escucha en `172.18.0.1:8788` (regla ufw acotada a `172.18.0.0/16`).
- ✅ **Exposición**: DNS `t` (Cloudflare, proxied) + `/etc/easypanel/traefik/config/t.yaml` (solo `/t/*` y `/salud`; certificado Let's Encrypt emitido; ojo: si se crea el DNS DESPUÉS del yaml, Traefik falla con NXDOMAIN y hay que reemplazar el archivo con `mv` para que reintente). Monitor: `monitor-store.sh` vigila `https://t.mariomoreno.work/salud` (tema Portfolio).
- ✅ **Verificado**: (a) curl al colector por HTTPS: visita, duración, demo, contacto → filas en `pf_*` (país `DE` vía Cloudflare), bot → 204 sin guardar, sin Origin/Origin ajeno → 403, preflight CORS OK; (b) el módulo REAL `src/lib/analytics.ts` compilado y ejecutado con stubs de navegador → visita con `?utm_source`, referrer y duración (sendBeacon), demo y contacto guardados. Todas las filas de prueba se borraron (`pf_page_views`=0, `pf_contact_messages`=0, `pf_demo_runs`=16 como antes).
- ✅ **Cliente** (rama `admin-v2`, commit `ee6c8ae`): `analytics.ts` envía al colector (también corrige el bug previo de `flush`, que dejaba `viewId=null` antes de usarlo, y el `anon_id` de respaldo, que era demasiado corto), `Caddyfile` permite `t.mariomoreno.work` en `connect-src`, `VITE_COLLECTOR_URL` declarada. `npm run build` OK.
- ⏳ **Falta para cerrar la fase 0**: DESPLEGAR el cliente (push a `main` = deploy del portfolio; necesita el «sí» de Mario) y comprobar una visita real en `pf_page_views` con su duración. Recomendación: desplegar cuanto antes; cada día sin captura son datos perdidos.
- Nota H4: el espejo de contacto antiguo SÍ habría funcionado (INSERT sin `return`), así que `pf_contact_messages=0` significa que nadie había escrito por el formulario desde que existe el espejo.

## 5. Decisiones que necesito de Mario
1. **Arquitectura**: ¿colector + API en el VPS (recomendado, sin acción tuya) o la alternativa B con un SQL que pegarías tú en Supabase?
2. **Subdominio** para el colector/API (propongo `t.mariomoreno.work`; lo creo yo con el token de Cloudflare).
3. **Privacidad**: ¿guardamos IP? Propongo NO (solo país y un ID anónimo en cookie ya existente) y banner/nota de analítica si lo ves necesario.
