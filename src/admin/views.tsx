// Vistas del panel: Resumen, Tráfico, Demos IA, Mensajes, Captación, Salud y Avisos. Cada una consulta su ruta /admin/* y conserva los datos previos al recargar.
import React, { useState } from 'react';
import { ApiError, call, useApi, type Avisos, type Campana, type Captacion, type Demos, type Live, type Messages, type Msg, type Range, type Salud, type Summary } from './api';
import { BarList, Card, Columns, DataTable, Empty, Funnel, SegBar, Status, Tile, TimeChart } from './charts';
import { T, ago, countryName, fmtDate, fmtDur, fmtPct } from './theme';

// min(100%, Npx): nunca desborda en pantallas estrechas. Las filas de tarjetas KPI usan la clase .tiles (4 por fila; 2 en móvil), definida en AdminApp.
const grid = (min: number, gap = 14): React.CSSProperties => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))`, gap });
const font = { fontFamily: T.font } as const;
const dim = (loading: boolean): React.CSSProperties => ({ opacity: loading ? 0.55 : 1, transition: 'opacity .15s' });   // recarga: se mantiene el marco, sin esqueletos

export function Banner({ error, onRetry }: { error: ApiError | null; onRetry: () => void }) {
  if (!error) return null;
  return (
    <div role="alert" style={{ background: '#2a1a1a', border: `1px solid ${T.critical}`, color: T.text, borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', ...font }}>
      <span>✖ {error.status === 401 ? 'Tu sesión caducó: cierra sesión y vuelve a entrar.' : error.status === 403 ? 'Esta cuenta no tiene permiso para el panel.' : `No pude leer los datos (${error.message}). Muestro lo último que tenía; reintento solo.`}</span>
      <button onClick={onRetry} style={{ background: T.raised, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontSize: 12.5 }}>Reintentar</button>
    </div>
  );
}

function Loading() { return <Empty>Cargando…</Empty>; }

/* ================= Resumen ================= */
export function Resumen({ range }: { range: Range }) {
  const { data: s, error, loading, reload } = useApi<Summary>('/admin/summary', { range });
  if (!s) return <><Banner error={error} onRetry={reload} /><Loading /></>;
  const k = s.kpis;
  return (
    <div style={{ display: 'grid', gap: 14, ...dim(loading) }}>
      <Banner error={error} onRetry={reload} />
      {s.empty && <Card><Empty>Todavía no hay visitas en este rango. El sitio registra cada visita real (sin bots) desde el 26-nov; en cuanto entren, aparecen aquí.</Empty></Card>}
      <Tile hero label="Visitas" kpi={k.visits} />
      <div className="tiles">
        <Tile label="Visitantes únicos" kpi={k.uniques} />
        <Tile label="Ya habían venido antes" kpi={k.returning} hint="Visitantes del periodo que también visitaron en el periodo anterior" />
        <Tile label="Tiempo medio por visita" kpi={k.avg_seconds} fmt={fmtDur} />
        <Tile label="Visitas de menos de 10 s" kpi={k.short_pct} fmt={fmtPct} upIsGood={false} hint="Visitas sin duración registrada o de menos de 10 segundos (proxy de rebote)" />
        <Tile label="Demos de IA probadas" kpi={k.demo_runs} />
        <Tile label="Mensajes de contacto" kpi={k.contacts} />
        <Tile label="Reseñas" kpi={k.reviews} />
        <Tile label="Clics en WhatsApp" kpi={k.whatsapp} />
      </div>
      <Card title={`Visitas en el tiempo · ${s.range === '24h' ? 'por hora' : 'por día'} (hora de Caracas)`}><TimeChart data={s.series} hourly={s.range === '24h'} /></Card>
      <div style={grid(400)}>
        <Card title="Embudo de visitantes únicos"><Funnel stages={[{ name: 'Visitaron el sitio', v: s.funnel.visitors }, { name: 'Probaron una demo', v: s.funnel.demo }, { name: 'Escribieron por el formulario', v: s.funnel.contact }]} /></Card>
        <Card title="De dónde llegan"><BarList rows={s.sources.slice(0, 6)} fmtName={(n) => (n === 'directo' ? 'Directo' : n)} color={T.series[2]} /></Card>
        <Card title="Países"><BarList rows={s.countries.slice(0, 6)} fmtName={countryName} color={T.series[0]} /></Card>
        <Card title="Páginas más vistas"><BarList rows={s.pages.slice(0, 6)} color={T.series[6]} /></Card>
      </div>
    </div>
  );
}

/* ================= Tráfico ================= */
export function Trafico({ range }: { range: Range }) {
  const { data: s, error, loading, reload } = useApi<Summary>('/admin/summary', { range });
  const live = useApi<Live>('/admin/live', {}, 8000);
  if (!s) return <><Banner error={error} onRetry={reload} /><Loading /></>;
  return (
    <div style={{ display: 'grid', gap: 14, ...dim(loading) }}>
      <Banner error={error} onRetry={reload} />
      <Card title="En vivo" right={<span style={{ color: T.sub, fontSize: 12.5 }}>{live.data ? `${live.data.active_5min} visitante${live.data.active_5min === 1 ? '' : 's'} en los últimos 5 min` : '…'}</span>}>
        <DataTable head={['Cuándo', 'Página', 'Fuente', 'País', 'Dispositivo']} empty="Nadie ha entrado en los últimos 30 minutos."
          rows={(live.data?.last ?? []).map((v) => [ago(v.at), v.path, v.source === 'directo' ? 'Directo' : v.source, countryName(v.country), v.device])} />
      </Card>
      <Card title="Visitas por hora del día (hora de Caracas)"><Columns values={s.hours} labels={s.hours.map((_, h) => String(h).padStart(2, '0'))} unit="visitas" /></Card>
      <div style={grid(320)}>
        <Card title="Páginas"><BarList rows={s.pages} color={T.series[6]} /></Card>
        <Card title="Fuentes (utm_source o referente)"><BarList rows={s.sources} color={T.series[2]} fmtName={(n) => (n === 'directo' ? 'Directo' : n)} /></Card>
        <Card title="Países"><BarList rows={s.countries} fmtName={countryName} /></Card>
        <Card title="Dispositivos"><SegBar parts={Object.entries(s.devices).sort((a, b) => b[1] - a[1])} /></Card>
        <Card title="Navegadores"><SegBar parts={Object.entries(s.browsers).sort((a, b) => b[1] - a[1])} /></Card>
      </div>
    </div>
  );
}

/* ================= Demos IA ================= */
export function DemosView({ range }: { range: Range }) {
  const { data: d, error, loading, reload } = useApi<Demos>('/admin/demos', { range });
  const sum = useApi<Summary>('/admin/summary', { range });
  if (!d) return <><Banner error={error} onRetry={reload} /><Loading /></>;
  const rate = d.total ? Math.round((d.failures.total * 100) / (d.total + d.failures.total)) : 0;
  return (
    <div style={{ display: 'grid', gap: 14, ...dim(loading) }}>
      <Banner error={error} onRetry={reload} />
      <div className="tiles">
        <Tile label="Demos probadas" kpi={{ v: d.total, p: sum.data?.kpis.demo_runs.p ?? null, d: sum.data?.kpis.demo_runs.d ?? null }} />
        <Tile label="Fallos que vieron los visitantes" kpi={{ v: d.failures.total, p: null, d: null }} upIsGood={false} hint="Reportados por el sitio al flujo de n8n (los límites de uso 429 no cuentan)" />
        <Tile label="Proporción de fallos" kpi={{ v: rate, p: null, d: null }} fmt={fmtPct} upIsGood={false} />
      </div>
      <div style={grid(320)}>
        <Card title="Uso por demo"><BarList rows={d.by_demo} color={T.series[5]} empty="Nadie ha probado una demo en este rango." /></Card>
        <Card title="Fallos por demo"><BarList rows={d.failures.by_demo.map(([n, v]) => [n ?? '?', v] as [string, number])} color={T.series[7]} empty="Sin fallos reportados en este rango. ✔" /></Card>
      </div>
      <Card title="Fallos recientes"><DataTable head={['Cuándo', 'Demo', 'HTTP', 'Detalle']} empty="Sin fallos recientes." rows={d.failures.recent.map((f) => [fmtDate(f.at), f.demo, f.status ?? '—', f.message])} /></Card>
      <Card title="Últimas consultas a las demos"><DataTable head={['Cuándo', 'Demo', 'Texto']} empty="Aún no hay consultas." rows={d.recent.map((r) => [fmtDate(r.at), r.demo, r.input || '—'])} /></Card>
    </div>
  );
}

/* ================= Mensajes ================= */
const STATES: [Msg['status'], string][] = [['new', 'Nuevo'], ['read', 'Leído'], ['archived', 'Archivado']];
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

export function Mensajes() {
  const [status, setStatus] = useState(''); const [kind, setKind] = useState(''); const [q, setQ] = useState(''); const [busy, setBusy] = useState('');
  const { data, error, loading, reload } = useApi<Messages>('/admin/messages', { status, kind, q }, 30000);
  async function set(id: string, st: Msg['status']) {
    setBusy(id);
    try { await call(`/admin/messages/${id}`, {}, { method: 'PATCH', body: JSON.stringify({ status: st }) }); reload(); } finally { setBusy(''); }
  }
  async function csv() {
    const txt = await call<string>('/admin/messages.csv', { status, kind, q });
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' })); a.download = `mensajes-portfolio-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }
  const sel: React.CSSProperties = { background: T.card, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 10px', fontSize: 13, ...font };
  return (
    <div style={{ display: 'grid', gap: 14, ...dim(loading) }}>
      <Banner error={error} onRetry={reload} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <select aria-label="Tipo" value={kind} onChange={(e) => setKind(e.target.value)} style={sel}><option value="">Contactos y reseñas</option><option value="contacto">Solo contactos</option><option value="resena">Solo reseñas</option></select>
        <select aria-label="Estado" value={status} onChange={(e) => setStatus(e.target.value)} style={sel}><option value="">Cualquier estado</option>{STATES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <input aria-label="Buscar" placeholder="Buscar nombre, correo o texto…" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...sel, minWidth: 240, flex: '1 1 240px' }} />
        <button onClick={csv} style={{ ...sel, cursor: 'pointer' }}>Exportar CSV</button>
      </div>
      {!data ? <Loading /> : data.items.length === 0 ? <Card><Empty>No hay mensajes con estos filtros. Cuando alguien escriba por el formulario o deje una reseña, aparece aquí (y te llega el aviso a Telegram).</Empty></Card> : (
        <div style={{ display: 'grid', gap: 10 }}>
          {data.items.map((m) => (
            <article key={m.id} style={{ background: T.card, border: `1px solid ${m.status === 'new' ? T.accent : T.border}`, borderRadius: 14, padding: '14px 16px', ...font }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <div style={{ color: T.text, fontWeight: 650, fontSize: 14 }}>{m.name || 'Sin nombre'} <span style={{ color: T.muted, fontWeight: 400, fontSize: 12.5 }}>· {m.kind === 'resena' ? `Reseña ${m.rating ? stars(m.rating) : ''}` : 'Contacto'} · {fmtDate(m.at)}</span></div>
                <div style={{ display: 'flex', gap: 6 }} role="group" aria-label="Estado">
                  {STATES.map(([v, l]) => <button key={v} disabled={busy === m.id} aria-pressed={m.status === v} onClick={() => set(m.id, v)} style={{ background: m.status === v ? T.accent : 'transparent', color: m.status === v ? '#fff' : T.sub, border: `1px solid ${m.status === v ? T.accent : T.border}`, borderRadius: 8, padding: '3px 10px', fontSize: 12, cursor: 'pointer' }}>{l}</button>)}
                </div>
              </div>
              <p style={{ margin: '4px 0 8px', color: T.sub, fontSize: 13.5, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{m.kind === 'resena' ? (m.message || '').replace(/^\[\d\/5\]\s*/, '') || '(sin comentario)' : m.message}</p>
              {(m.email || m.phone) && <div style={{ fontSize: 12.5, color: T.muted }}>{m.email && <a href={`mailto:${m.email}`} style={{ color: T.accent }}>{m.email}</a>}{m.email && m.phone && ' · '}{m.phone}</div>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= Captación ================= */
const STATE_ES: Record<string, string> = { descartado: 'Descartado', aprobado: 'Aprobado, en espera', t1: 'Toque 1 enviado', t2: 'Toque 2 enviado', t3: 'Toque 3 enviado', baja: 'Se dio de baja', entregado: 'Entregado', enviado: 'Enviado, sin confirmar' };
export function CaptacionView() {
  const v2 = useApi<Campana>('/admin/campana', {}, 60000);
  const { data: c, error, loading, reload } = useApi<Captacion>('/admin/captacion', {}, 120000);
  const k = v2.data;
  const nk = (v: number) => ({ v, p: null, d: null });
  if (!k) return <><Banner error={v2.error ?? error} onRetry={() => { v2.reload(); reload(); }} /><Loading /></>;
  const days = k.last_sent ? Math.floor((Date.now() - new Date(k.last_sent).getTime()) / 86400000) : null;
  return (
    <div style={{ display: 'grid', gap: 14, ...dim(v2.loading || loading) }}>
      <Banner error={v2.error ?? error} onRetry={() => { v2.reload(); reload(); }} />
      <Card title="Campaña V2 · correo en frío" right={<Status ok={!k.paused} okText="Activa" badText="En pausa" />}>
        <p style={{ margin: 0, color: T.sub, fontSize: 13, lineHeight: 1.55, ...font }}>
          Empezó el {k.start_date ?? '—'} · último envío real: <b style={{ color: T.text }}>{k.last_sent ? `${fmtDate(k.last_sent)} (hace ${days} d)` : 'ninguno'}</b>
          {days !== null && days >= 7 && !k.paused && <span style={{ color: T.warning }}> · ⚠ lleva {days} días sin enviar: revisar topes, ventana horaria y toques pendientes.</span>}
        </p>
      </Card>
      <div className="tiles t3">
        <Tile label="Prospectos en base" kpi={nk(k.prospects.total)} /><Tile label="Correos enviados (reales)" kpi={nk(k.sent)} hint={`Sin contar ${k.trial_sent} de ensayo`} />
        <Tile label="Entregados confirmados" kpi={nk(k.delivered)} /><Tile label="Rebotes" kpi={nk(k.bounced)} upIsGood={false} />
        <Tile label="Bajas y supresiones" kpi={nk(k.suppressed.total)} hint="Direcciones que no se vuelven a contactar: plataformas, bajas voluntarias, rebotes duros y quejas (tabla c2_supresion)" /><Tile label="Envíos de ensayo (aparte)" kpi={nk(k.trial_sent)} />
      </div>
      <Card title="Envíos reales de los últimos 14 días (hora de Caracas)"><Columns values={k.by_day.map((d) => d.sent)} labels={k.by_day.map((d) => `${d.day.slice(8, 10)}/${d.day.slice(5, 7)}`)} unit="enviados" color={T.series[1]} /></Card>
      <div style={grid(340)}>
        <Card title="Prospectos por estado"><BarList rows={k.prospects.by_state} fmtName={(n) => STATE_ES[n] ?? n} color={T.series[0]} /></Card>
        <Card title="Correos por toque"><BarList rows={k.by_touch} color={T.series[1]} empty="Aún no se ha enviado ningún correo." /></Card>
        <Card title="Estado de entrega"><BarList rows={k.by_delivery} fmtName={(n) => STATE_ES[n] ?? n} color={T.series[2]} empty="Sin envíos." /></Card>
        <Card title="Canal de contacto de los prospectos"><BarList rows={k.prospects.by_channel} fmtName={(n) => (n === 'correo' ? 'Correo' : n === 'formulario_manual' ? 'Formulario manual' : n === 'whatsapp_manual' ? 'WhatsApp manual' : n === 'revisar_buzon_gratuito' ? 'Revisar buzón gratuito' : n)} color={T.series[3]} /></Card>
      </div>
      <Card title="Respuestas a la campaña"><Empty>Las respuestas todavía <b>no se registran en la base de datos</b> (no hay tabla de respuestas en la V2): te llegan por Telegram (tema 📣 Campaña) y quedan en el buzón. Esta sección no muestra «0 respuestas» porque sería falso: se mostrará en cuanto se registren.</Empty></Card>
      <Card title="Últimos eventos de la campaña"><DataTable head={['Cuándo', 'Evento', 'Detalle']} empty="Sin eventos." rows={k.recent_events.map((e) => [fmtDate(e.at), e.type, e.detail])} />
        {k.unmatched_resend_events > 0 && <p style={{ margin: '10px 0 0', color: T.muted, fontSize: 12.5, ...font }}>Además hay {k.unmatched_resend_events} avisos de Resend (rebotes/entregas) que no corresponden a ningún envío de la V2: vienen de otros correos de la misma cuenta.</p>}
      </Card>
      {c && (
        <Card title="Campaña anterior (V1, histórica — apagada)" right={<span style={{ color: T.muted, fontSize: 12 }}>tabla outreach_log</span>}>
          <p style={{ margin: '0 0 12px', color: T.muted, fontSize: 12.5, lineHeight: 1.5, ...font }}>Datos reales de la primera campaña (mayo–octubre). No incluye la V2.</p>
          <div className="tiles t3"><Tile label="Correos enviados" kpi={nk(c.sent)} /><Tile label="Con respuesta" kpi={nk(c.replied)} /><Tile label="Tasa de respuesta" kpi={nk(c.reply_rate)} fmt={fmtPct} /></div>
          <div style={{ marginTop: 14 }}><BarList rows={c.by_country} color={T.series[0]} empty="" /><p style={{ margin: '8px 0 0', color: T.muted, fontSize: 12, ...font }}>Ciudades/regiones de destino (el campo se llamaba «país» pero guarda la ciudad).</p></div>
        </Card>
      )}
    </div>
  );
}

/* ================= Salud ================= */
export function SaludView() {
  const { data: s, error, loading, reload } = useApi<Salud>('/admin/salud', {}, 30000);
  if (!s) return <><Banner error={error} onRetry={reload} /><Loading /></>;
  return (
    <div style={{ display: 'grid', gap: 14, ...dim(loading) }}>
      <Banner error={error} onRetry={reload} />
      <div style={grid(320)}>
        <Card title="Servicios (comprobados ahora)"><DataTable head={['Servicio', 'Estado', 'Respuesta']} empty="Sin datos" rows={s.sites.map((x) => [x.name, <Status key={x.name} ok={x.ok} />, `HTTP ${x.code || '—'} · ${x.ms} ms`])} /></Card>
        <Card title="Demos de IA (último estado del monitor de las 13:00 UTC)"><DataTable head={['Demo', 'Estado', 'Desde']} empty="El monitor aún no registró cambios de estado." rows={s.demos.map((x) => [x.name, <Status key={x.name} ok={x.ok} okText="Recuperada" badText="Fallando" />, ago(x.at)])} /></Card>
      </div>
      <Card title="Alertas recientes de n8n"><DataTable head={['Cuándo', 'Origen', 'Gravedad', 'Qué', 'Detalle']} empty="Sin alertas." rows={s.alerts.map((a) => [fmtDate(a.at), a.source, a.severity, a.what, a.message])} /></Card>
    </div>
  );
}

/* ================= Avisos ================= */
export function AvisosView() {
  const { data: a, error, loading, reload } = useApi<Avisos>('/admin/avisos', {}, 20000);
  if (!a) return <><Banner error={error} onRetry={reload} /><Loading /></>;
  return (
    <div style={{ display: 'grid', gap: 14, ...dim(loading) }}>
      <Banner error={error} onRetry={reload} />
      <Card title="Reglas de aviso a Telegram (tema 🌐 Portfolio)"><DataTable head={['Aviso', 'Cuándo']} empty="" rows={a.rules.map((r) => [r.name, r.when])} /></Card>
      <Card title="Últimos avisos enviados"><DataTable head={['Cuándo', 'Tipo', 'Aviso', 'Estado']} empty="Aún no se ha enviado ningún aviso." rows={a.recent.map((e) => [fmtDate(e.at), e.type, e.title, e.state === 'enviado' ? '✔ enviado' : e.state])} /></Card>
    </div>
  );
}

