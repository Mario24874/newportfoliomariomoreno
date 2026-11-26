// Datos simulados SOLO para la vista previa de desarrollo (npm run dev + /admin?mock). No entra en el build de producción.
import type { Range } from './api';
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const ri = (a: number, b: number) => Math.floor(a + rnd() * (b - a + 1));
const iso = (minAgo: number) => new Date(Date.now() - minAgo * 60000).toISOString();

export function mock(path: string, params: Record<string, string>): unknown {
  const rng = (params.range as Range) || '7d';
  if (path === '/admin/summary') {
    const n = rng === '24h' ? 24 : rng === '7d' ? 7 : rng === '30d' ? 30 : 90, hourly = rng === '24h';
    const series = Array.from({ length: n }, (_, i) => { const v = ri(8, 60) + (i % 7 === 5 ? 40 : 0); const d = new Date(Date.now() - (n - 1 - i) * (hourly ? 3600000 : 86400000));
      return { t: d.toISOString().slice(0, hourly ? 13 : 10) + (hourly ? ':00:00' : 'T00:00:00'), visits: v, uniques: Math.round(v * 0.7) }; });
    const total = series.reduce((a, s) => a + s.visits, 0);
    const kp = (v: number, d: number | null = ri(-30, 60)) => ({ v, p: d === null ? null : Math.round(v / (1 + d / 100)), d });
    return { range: rng, generated_at: iso(0), tz: 'America/Caracas (UTC-4)', empty: false,
      kpis: { visits: kp(total), uniques: kp(Math.round(total * 0.7)), returning: kp(Math.round(total * 0.12), null), avg_seconds: kp(84), short_pct: kp(38, -6.5), demo_runs: kp(41), contacts: kp(6), reviews: kp(3), whatsapp: kp(17), unread: kp(2, null) },
      series, hours: Array.from({ length: 24 }, (_, h) => Math.round(ri(2, 20) * (h >= 8 && h <= 22 ? 2.2 : 0.6))),
      countries: [['VE', 210], ['US', 96], ['ES', 54], ['MX', 31], ['CO', 22], ['IT', 9]], pages: [['/', 330], ['/admin', 12], ['/menu', 7]],
      sources: [['directo', 160], ['instagram', 88], ['google.com', 61], ['linkedin', 44], ['campana', 20]], devices: { móvil: 240, escritorio: 150, tablet: 12 }, browsers: { Chrome: 210, Safari: 120, Edge: 40, Firefox: 22 },
      funnel: { visitors: Math.round(total * 0.7), demo: 41, contact: 6 } };
  }
  if (path === '/admin/live') return { generated_at: iso(0), active_5min: 3, last: [{ path: '/', country: 'VE', device: 'móvil', source: 'instagram', at: iso(1) }, { path: '/', country: 'US', device: 'escritorio', source: 'directo', at: iso(4) }, { path: '/', country: 'ES', device: 'móvil', source: 'google.com', at: iso(11) }] };
  if (path === '/admin/demos') return { range: rng, total: 41, by_demo: [['whatsapp-agent', 19], ['research', 12], ['content', 6], ['support', 4]], recent: [{ demo: 'research', input: 'tendencias de IA para restaurantes', at: iso(30) }, { demo: 'whatsapp-agent', input: 'hola, ¿tienen disponibilidad?', at: iso(55) }],
    failures: { total: 2, by_demo: [['research', 2]], recent: [{ demo: 'research', status: 503, message: 'Request failed with status code 503', at: iso(300) }] } };
  if (path === '/admin/messages') return { total: 3, items: [
    { id: '1', kind: 'contacto', name: 'Ana Pérez', email: 'ana@ejemplo.com', phone: '+58 412 0000000', message: 'Hola Mario, me interesa un agente de WhatsApp para mi clínica.\nPodemos hablar esta semana?', rating: null, status: 'new', at: iso(90) },
    { id: '2', kind: 'resena', name: 'Luis', email: null, phone: null, message: '[5/5] Muy buen portafolio y demos útiles', rating: 5, status: 'read', at: iso(600) },
    { id: '3', kind: 'contacto', name: 'Marta', email: 'marta@ejemplo.com', phone: null, message: 'Cotización de automatización con n8n', rating: null, status: 'archived', at: iso(3000) }] };
  if (path === '/admin/captacion') return { sent: 32, replied: 3, reply_rate: 9.4, by_status: [['sent', 29], ['bounced', 3]], by_country: [['US', 14], ['ES', 9], ['MX', 6]], by_day: Array.from({ length: 14 }, (_, i) => ({ day: new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10), sent: ri(0, 8) })), replies: [{ company: 'Café Roma', at: iso(900), subject: 'Re: Menú digital' }] };
  if (path === '/admin/campana') return { sent: 17, trial_sent: 6, last_sent: iso(60 * 24 * 10), delivered: 11, bounced: 0, by_touch: [['Toque 1', 6], ['Toque 2', 6], ['Toque 3', 5]], by_delivery: [['entregado', 11], ['enviado', 6]],
    by_day: Array.from({ length: 14 }, (_, i) => ({ day: new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10), sent: i < 6 ? ri(0, 4) : 0 })),
    prospects: { total: 60, by_state: [['descartado', 46], ['aprobado', 8], ['t3', 5], ['baja', 1]], by_cell: [['A', 60]], by_channel: [['sin canal', 44], ['correo', 6], ['formulario_manual', 5], ['whatsapp_manual', 4]] },
    suppressed: { total: 9, by_reason: [['plataforma', 8], ['baja', 1]] }, batches: [['aprobado', 1]], paused: false, start_date: '2026-11-05', unmatched_resend_events: 87,
    recent_events: [{ at: iso(60 * 24 * 9), type: 'baja', detail: '{"valor":"x@y.z"}' }], replies_tracked: false };
  if (path === '/admin/salud') return { generated_at: iso(0), sites: [{ name: 'Sitio', ok: true, code: 200, ms: 92 }, { name: 'Colector', ok: true, code: 200, ms: 80 }, { name: 'Avisador', ok: true, code: 200, ms: 86 }, { name: 'n8n', ok: false, code: 502, ms: 3000 }], demos: [{ name: 'Contenido', ok: true, status: 'recovered', at: iso(900) }, { name: 'Investigación', ok: false, status: 'error', at: iso(60) }], alerts: [{ at: iso(60), source: 'monitor', severity: 'error', what: 'demo Investigación', message: '503 de Gemini' }] };
  if (path === '/admin/avisos') return { rules: [{ name: '✉️ Mensaje de contacto', when: 'inmediato' }, { name: 'ℹ️ Resumen diario', when: '12:05 UTC' }], recent: [{ at: iso(5), type: 'mensaje', title: 'Mensaje de contacto', state: 'enviado' }] };
  return {};
}
