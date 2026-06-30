-- ============================================================
-- Portafolio Mario Moreno — Portal Admin (tablas pf_* + RLS)
-- Correr en: Supabase Dashboard → SQL Editor  (proyecto ujpscasplurkdcsryjme)
--
-- Estas tablas son EXCLUSIVAS del portafolio (mariomoreno.work). Comparten la
-- misma Supabase que outreach-tracker pero NO se mezclan: prefijo `pf_`, RLS
-- propio. NO tocan ninguna tabla de gestión de clientes.
--
-- Modelo de seguridad:
--   • INSERT público (rol anon) SOLO en analítica → el SPA escribe con la
--     anon key. Sin SELECT para anon: nadie puede leer los datos desde el navegador.
--   • SELECT únicamente para el owner autenticado (tu gmail) vía RLS.
-- ============================================================

-- Correo(s) con acceso de lectura al panel. Cámbialo aquí si algún día agregas otro.
-- (Se evalúa contra el JWT de Supabase Auth: auth.jwt() ->> 'email')

-- ---------- pf_page_views : visitas anónimas (portfolio + app) ----------
CREATE TABLE IF NOT EXISTS public.pf_page_views (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_id          TEXT        NOT NULL,
  area             TEXT        NOT NULL DEFAULT 'portfolio' CHECK (area IN ('portfolio','app')),
  path             TEXT        NOT NULL,
  section          TEXT,
  referrer         TEXT,
  user_agent       TEXT,
  country          TEXT,
  duration_seconds INTEGER,
  entered_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pf_pv_entered ON public.pf_page_views (entered_at DESC);
CREATE INDEX IF NOT EXISTS idx_pf_pv_anon    ON public.pf_page_views (anon_id);

-- ---------- pf_demo_runs : demos/agentes IA probados ----------
CREATE TABLE IF NOT EXISTS public.pf_demo_runs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_id       TEXT,
  demo          TEXT        NOT NULL,
  input_preview TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pf_demo_created ON public.pf_demo_runs (created_at DESC);

-- ---------- pf_contact_messages : formulario de contacto del portfolio ----------
CREATE TABLE IF NOT EXISTS public.pf_contact_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT,
  email      TEXT,
  phone      TEXT,
  message    TEXT,
  source     TEXT        DEFAULT 'portfolio',
  anon_id    TEXT,
  status     TEXT        NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pf_contact_created ON public.pf_contact_messages (created_at DESC);

-- ---------- pf_email_replies : contenido de respuestas entrantes (n8n Gmail) ----------
CREATE TABLE IF NOT EXISTS public.pf_email_replies (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_email      TEXT,
  from_name       TEXT,
  subject         TEXT,
  body_preview    TEXT,
  outreach_log_id TEXT,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pf_reply_received ON public.pf_email_replies (received_at DESC);

-- ---------- pf_scrape_events : lotes de scraping notificados por n8n ----------
CREATE TABLE IF NOT EXISTS public.pf_scrape_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow      TEXT,
  event         TEXT,
  query         TEXT,
  business_name TEXT,
  email         TEXT,
  payload       JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pf_scrape_created ON public.pf_scrape_events (created_at DESC);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.pf_page_views      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pf_demo_runs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pf_contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pf_email_replies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pf_scrape_events   ENABLE ROW LEVEL SECURITY;

-- INSERT público (anon) solo para analítica escrita desde el navegador.
CREATE POLICY pf_pv_insert   ON public.pf_page_views       FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY pf_demo_insert ON public.pf_demo_runs        FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY pf_msg_insert  ON public.pf_contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Permitir corregir la duración de la propia visita (PATCH desde el navegador).
CREATE POLICY pf_pv_update   ON public.pf_page_views       FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- SELECT solo para el owner autenticado (tu gmail). El resto no lee nada.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['pf_page_views','pf_demo_runs','pf_contact_messages','pf_email_replies','pf_scrape_events']
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (auth.jwt() ->> ''email'' = ''marioivanmorenopineda@gmail.com'')',
      'pf_owner_read_' || t, t
    );
  END LOOP;
END $$;

-- pf_email_replies / pf_scrape_events los escribe n8n con la service_role (bypassa RLS),
-- por eso no llevan policy de INSERT pública.

-- ============================================================
-- (OPCIONAL) Lectura de los leads de scraping ya existentes (outreach_log)
-- desde el panel del portafolio, sin duplicar datos. Es de SOLO LECTURA y
-- acotada a tu correo; no altera datos ni el comportamiento de outreach-tracker.
-- Descoméntalo si prefieres leer outreach_log directo en vez de espejar a pf_*.
-- ------------------------------------------------------------
-- ALTER TABLE public.outreach_log ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY pf_owner_read_outreach_log ON public.outreach_log
--   FOR SELECT TO authenticated
--   USING (auth.jwt() ->> 'email' = 'marioivanmorenopineda@gmail.com');
