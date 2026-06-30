# Roadmap — Portafolio + app.mariomoreno.work

> Última actualización: 2026-06-30
> Dos proyectos **separados que se conectan pero no se mezclan**:
> - **mariomoreno.work** (portafolio / `newportfoliomariomoreno`): puerta de entrada y presentación. Portal `/admin` = monitoreo y análisis de métricas (luego se le suman más funciones).
> - **app.mariomoreno.work** (`outreach-tracker`): gestor de clientes registrados. Proyecto presentado a Meta (WhatsApp Business). Aquí vive el envío real de WhatsApp.
> - Comparten la misma Supabase (`ujpscasplurkdcsryjme`) pero con tablas/RLS propios. n8n (independiente) los alimenta.

---

## ✅ Hecho (2026-06-30)
- Portal admin del portafolio en `mariomoreno.work/admin`: login Google restringido al owner (allowlist + RLS), dashboard de métricas. **LIVE**.
- Tablas `pf_*` en Supabase con RLS (page_views, demo_runs, contact_messages, email_replies, scrape_events).
- Analítica propia del portafolio (visitas + duración, demos probados, formulario de contacto) — **desacoplada de outreach-tracker** (antes `trackVisit` apuntaba a app.mariomoreno.work).
- SDK Supabase aislado en el chunk de `/admin` (no pesa en el home → SEO/perf intactos).

---

## 🟡 Portafolio (mariomoreno.work) — pendiente
1. **Alimentar el panel con datos de n8n** (para que `/admin` muestre respuestas y scraping):
   - `pf_email_replies` ← flujo "Outreach Gmail Reply Tracker" (agregar destino REST a `pf_email_replies`).
   - `pf_scrape_events` ← flujos de scraping (notificar cada lote/lead).
2. **Leads de scraping en el panel**: activar la policy opcional de solo-lectura sobre `outreach_log` (acotada al owner) — está comentada en `supabase/portfolio_admin.sql`.
3. **SEO**: verificar/cerrar `sitemap.xml`, `robots.txt` (con `Disallow: /admin`), Open Graph y JSON-LD `Person`.
4. **Futuras funciones del admin** (más allá de métricas): definir (ej. gestión de contenido, leads del portfolio, etc.).

## 🟡 app.mariomoreno.work (gestor de clientes) — pendiente
1. **Número de WhatsApp de producción + Meta App Review** *(quedó pendiente de la sesión anterior)*:
   - Registrar/configurar el número de WhatsApp Business que enviará.
   - Enviar la app a **App Review** de Meta para acceso avanzado a `whatsapp_business_messaging`.
   - Estado de plantillas (memoria 2026-06-17): `appointment_reminder` ✅ APPROVED (id 840896338780049, UTILITY, en_US), `hello_world` ✅. **Re-verificar estado actual vía Graph API** al retomar.
2. **Plantilla de OUTREACH aprobada**: crear/aprobar una plantilla para el primer contacto (categoría MARKETING/UTILITY según uso). ⚠️ Ver nota de política abajo.
3. **Migrar envío de WhatsApp de YCloud → Meta Cloud API**: ya existe `lib/whatsapp.ts` + `/api/whatsapp/send` con credenciales Meta. Exponer un endpoint para que n8n dispare envíos con plantilla aprobada.

## 🟡 n8n — flujos de scraping y reenvío
Ver evaluación detallada abajo. Acciones:
1. **Migrar WhatsApp de YCloud → Meta** en el flujo VE1 y en el de reenvío (usar Meta vía app.mariomoreno.work).
2. **Reenvío de fallidos**: rehacer para que tome los leads "no enviados / fallidos" desde **Supabase (`outreach_log`)**, no desde el historial de YCloud.
3. **Seguridad**: sacar secretos hardcodeados a credenciales de n8n.

---

## 🔍 Evaluación de los 3 flujos de n8n (2026-06-30)

### 1) `Outreach Google Maps v4 (+body_preview)` — internacional · ACTIVO
Pipeline lineal limpio: Schedule 9AM → Config → Industria del día → Google Maps (textsearch + details) → Verificar dominio → Hunter.io email → Gemini email → Filter → Resend → Log → Supabase (`outreach_log`) → Notificar SaaS.
- **Veredicto:** bien construido. Solo email (sin WhatsApp).
- Mejora menor: secretos viven en el nodo `Configuracion` (Set) — aceptable, idealmente credenciales de n8n.

### 2) `Outreach Google Maps VE1 (+body_preview)` — Venezuela · ACTIVO
Igual al v4 + ramas WhatsApp: … → Filter VE → ¿Tiene Email? → Resend → ¿Tiene WhatsApp? → **Enviar WhatsApp VE1** → Log → Supabase → SaaS.
- Scraping VE sólido: valida número venezolano por prefijo (412/414/416/424/426), extrae dominio, limita a 3 resultados por query.
- **Problema:** `Enviar WhatsApp VE1` usa **YCloud** (`api.ycloud.com`) con plantilla `outreach_initial`. YCloud cobra por plantillas → **migrar a Meta Cloud API**.
- **Veredicto:** pipeline bien armado; el envío WA es el punto a migrar.

### 3) `Reenvio de Mensajes WA fallidos` — recuperación · ACTIVO
Un solo nodo de código: pagina todos los `failed` de YCloud → dedup por teléfono → reenvía con plantilla original (rate limit 2s).
- 🔴 **Seguridad CRÍTICA:** la API key de YCloud y el número están **hardcodeados en texto plano** en el código del nodo. **Rotar esa key** (quedó expuesta) y moverla a credenciales.
- **Problema:** depende de YCloud (pago) y lee los fallidos del **historial de YCloud**, no de Supabase.
- **Rehacer para Meta:** identificar leads sin envío / fallidos desde `outreach_log` y reenviar vía Meta con plantilla aprobada.
- **Veredicto:** funcional pero hay que rehacerlo para la migración a Meta + corregir el secreto.

---

## ⚠️ Nota de política (importante antes de escalar WhatsApp)
El outreach en frío por WhatsApp a números que no han dado opt-in tiene **riesgo de calidad/baneo** según las políticas de Meta. Al migrar a Meta Cloud API:
- Usar plantillas aprobadas y monitorear el **quality rating** del número.
- Respetar límites de tier y evitar marcado como spam (afecta al número de producción).
- Considerar warm-up del número y volúmenes escalonados.

---

## 🔒 Acción de seguridad inmediata
- **Rotar la API key de YCloud** (estaba hardcodeada en el flujo de reenvío y quedó expuesta). Revocarla en YCloud y, si se sigue usando temporalmente, ponerla en credenciales de n8n — nunca en el código del nodo.
