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
- ✅ **DESPLEGADO 26-nov 15:2x UTC** con el «sí» de Mario: push `a41afea..617a207` a `main` → webhook de GitHub → EasyPanel; el sitio sirve `index-BOYRZd4J.js` con el colector. **Verificación con visita REAL** (Chromium de Playwright con UA normal, `https://mariomoreno.work/?utm_source=verificacion-fase0`): `POST /t/pv` → 200 sin errores de CSP/CORS en consola; fila en `pf_page_views` con `path` incluyendo la fuente, `country=DE`, y `duration_seconds=5` enviada por `sendBeacon` al salir de la página. Filas de prueba borradas (`pf_page_views`=0 otra vez). **FASE 0 CERRADA.** Trampas: Chromium headless por defecto trae `HeadlessChrome` en el UA y el colector lo descarta como bot (correcto); `waitUntil:'networkidle'` nunca termina en este sitio (widgets/GA), usar `load`.
- Nota H4: el espejo de contacto antiguo SÍ habría funcionado (INSERT sin `return`), así que `pf_contact_messages=0` significa que nadie había escrito por el formulario desde que existe el espejo.

## 4c. Estado de la fase 1 — avisos de Telegram (26-nov, tarde)
**Hallazgo nuevo H8:** el widget de reseñas (`ReviewWidget`, montado en `App.tsx`) enviaba a `https://app.mariomoreno.work/api/analytics/review`, que **devuelve 404** → toda reseña que alguien intentara enviar mostraba error. Corregido en el cliente para usar el colector.
- ✅ **Servidor (ya en producción, no requiere deploy del sitio):** `ops/collector/collector.py` avisa al avisador (tema 🌐 Portfolio) en un hilo aparte tras guardar: ✉️ «Mensaje de contacto» (nombre + mensaje; SIN correo ni teléfono), ✉️ «Reseña n/5», ℹ️ «Clic en WhatsApp» (1 aviso por visitante y hora; el clic se guarda siempre como `pf_demo_runs.demo='click:whatsapp'`), ℹ️ «Pico de tráfico» (≥15 visitantes distintos/60 min, umbral `COLLECTOR_SPIKE_N`, enfriamiento 3 h), 🔴 «El colector no puede guardar en Supabase» (30 min de antirrepetición del avisador). Sin DDL, las reseñas se guardan en `pf_contact_messages` con `source='review'` y mensaje `[n/5] comentario`.
- ✅ **Resumen diario** `ops/collector/resumen.py` + `portfolio-resumen.timer` (12:05 UTC = 08:05 Caracas): visitas y variación vs 24 h previas, únicos, tiempo medio, países, demos por tipo, clics WhatsApp, mensajes, reseñas (media). Probado con envío real.
- ✅ **Fallos de demo** (n8n «⚠️ Fallos de demos reportados por visitantes» → avisador, migrado en A9): el flujo solo acepta `research|content|support|whatsapp-agent|gemini-live`, dedupe 30 min y tope 20/h; NO se probó de extremo a extremo con un fallo real para no escribir en `alerts.jsonl` (lo lee `alerts-watch`, que puede despertar a Claude); el nodo de envío es el mismo que se verificó en A9. Llegará con el primer fallo real.
- ✅ **Verificación (todo con avisos reales y filas de prueba borradas):** contacto, reseña y clic por HTTPS → 3 avisos en el tema; reseña con nota inválida → 400; el cliente real (`trackClick`/`submitReview` compilados) → clic y reseña guardados y avisados. 21 pruebas (incluye pruebas HTTP reales; una prueba de mutación confirmó que detectan el bug de `notify` enlazado como método, que SÍ se coló en la primera versión y se arregló).
- ✅ **Cliente DESPLEGADO 26-nov ~15:50 UTC** con el «sí» de Mario (push `617a207..c278670`, bundle `index-D1ZwNtqF.js`). Verificado en producción con Chromium (UA normal) por la interfaz real: reseña (estrella 4 + nombre + comentario) → `POST /t/review` 204, cuerpo con nombre y comentario correctos, aviso «Reseña 5/5» en el tema; clic en «Chat on WhatsApp» → `POST /t/click` y aviso «Clic en WhatsApp»; todas las filas de prueba borradas (`pf_page_views`=0, `pf_contact_messages`=0, `pf_demo_runs`=16). Trampas de la prueba: el diálogo de reseña abierto tapa el botón de WhatsApp; el límite de 3 reseñas/h por IP se consume con las pruebas (reiniciar `portfolio-collector` limpia los contadores en memoria).
- ⏳ **Falta (campaña):** «visita desde un lead de campaña»: los correos de campaña NO enlazan al portfolio con `utm_*` (se buscó en los scripts), así que no hay forma de atribuir la visita; requiere añadir `?utm_source=campana&utm_content=<id>` al enlace del correo (campaña V2, C1).

## 4d. Estado de la fase 2 — API admin + dashboard (26-nov, tarde)
- ✅ **API admin en producción** (servidor, no depende del deploy del sitio): rutas `GET /admin/summary|live|demos|messages|messages.csv|captacion|salud|avisos` y `PATCH /admin/messages/<id>` en `portfolio-collector` (`ops/collector/admin.py` + `collector.py`), expuestas por Traefik en `https://t.mariomoreno.work/admin/*`. **Seguridad:** exige `Authorization: Bearer <JWT de Supabase>`; el colector lo valida preguntando a Supabase Auth (`/auth/v1/user`, sin secretos JWT) y compara el correo con `ADMIN_EMAILS` (`/root/.secrets/portfolio-admin.env`, fuera del repo); además exige `Origin` del sitio y CORS acotado. Respuestas: sin token/ inválido 401, otra persona 403, origen ajeno 403. Todo con service_role en el servidor, RLS sigue cerrado.
- ✅ **Datos**: KPIs vs periodo anterior, serie por hora/día en hora de Caracas, embudo (visitantes→demo→contacto), fuentes (`utm_source` o referente), países, páginas, dispositivos/navegadores, horas pico, en vivo (5 min), demos (usos + fallos de visitantes desde `alerts.jsonl`), bandeja de mensajes con estado nuevo/leído/archivado y CSV, captación (`outreach_log`, solo lectura, sin correos), salud (sondeo de sitio/colector/avisador/n8n + último estado de las demos según el monitor), avisos (reglas + últimos enviados).
- ✅ **Dashboard** (rama `admin-v2`, `src/admin/*`): 7 secciones, filtros de rango en una fila, recarga cada 8–60 s sin vaciar la pantalla, errores con «Reintentar», gráficos SVG propios (sin librerías; chunk del admin 32 kB / 11 kB gzip). Diseño conforme al skill dataviz: paleta categórica validada en modo oscuro, leyenda, tooltip con hover y foco, vista de tabla, barras ≤24 px, estados con icono+texto. Vista previa solo en desarrollo (`npm run dev` → `/admin?mock`), eliminada del build.
- ✅ **Verificación**: 36 pruebas (agregados con datos sintéticos, HTTP con Supabase Auth simulado: sin token/otra persona/owner/origen/CORS/PATCH); las 8 rutas contra Supabase y archivos REALES (200, datos coherentes); rechazos reales por HTTPS (401 con un JWT falso contra Supabase Auth real, 403 con origen ajeno); capturas con Chromium de las 7 secciones en escritorio (1280) y móvil (390, sin desborde horizontal) con datos simulados; build de producción sin el mock.
- ✅ **DESPLEGADO 26-nov ~16:15 UTC** con el «sí» de Mario (push `c278670..2a3b6b0` a `main`; el despliegue publicó `index-DJDI-EIB.js` y el chunk `AdminApp-D5tOluU5.js`, el hash difiere del local por las variables de build). Verificado en producción: el chunk contiene el dashboard («Visitas en el tiempo», `admin/summary`) y NO contiene el mock; `/admin` en Chromium muestra «Panel de métricas · Entrar con Google» sin errores de consola/CSP; el preflight CORS desde el sitio devuelve 204 y la API sin sesión 401.
- ⏳ **Falta:** que Mario entre con Google en `https://mariomoreno.work/admin` (única prueba no automatizable). Si no carga: `journalctl -u portfolio-collector --since "10 min ago"` y mirar la pestaña de red (401/403/502). Después: ajustar umbrales y etiquetas con datos reales, atribución de campaña (`utm_*` en los correos), y (opcional) Campaña/Tienda en solo lectura.

## 5. Decisiones que necesito de Mario
1. **Arquitectura**: ¿colector + API en el VPS (recomendado, sin acción tuya) o la alternativa B con un SQL que pegarías tú en Supabase?
2. **Subdominio** para el colector/API (propongo `t.mariomoreno.work`; lo creo yo con el token de Cloudflare).
3. **Privacidad**: ¿guardamos IP? Propongo NO (solo país y un ID anónimo en cookie ya existente) y banner/nota de analítica si lo ves necesario.
