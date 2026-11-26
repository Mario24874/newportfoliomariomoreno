// Tokens del panel admin v2. Solo modo oscuro. Categóricos = pasos oscuros de la paleta validada del skill dataviz
// (azul, naranja, aqua, amarillo, magenta, verde, violeta, rojo; orden fijo, nunca cíclico); el texto NUNCA lleva el color de la serie.
export const T = {
  page: '#121211', card: '#1a1a19', raised: '#222220', border: '#2e2e2b', grid: '#2a2a28',
  text: '#f0efec', sub: '#c3c2b7', muted: '#8d8c82',
  accent: '#3987e5',
  series: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#0ca30c', '#9085e9', '#e66767'],
  funnel: ['#1c5cab', '#3987e5', '#86b6ef'],           // rampa ordinal azul (paso 550 -> 400 -> 250; en oscuro no más oscuro que 600)
  good: '#0ca30c', warning: '#fab219', serious: '#ec835a', critical: '#d03b3b',
  font: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
} as const;

export const TZ = 'America/Caracas';
const nf = new Intl.NumberFormat('es-VE');
export const fmtNum = (n: number) => (Math.abs(n) >= 10000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)} K` : nf.format(n));
export const fmtDur = (s: number) => (!s ? '0 s' : s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60 ? `${s % 60} s` : ''}`.trim());
export const fmtPct = (n: number) => `${n.toFixed(n % 1 ? 1 : 0)} %`;
export const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('es-VE', { timeZone: TZ, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
export function ago(iso?: string | null, now = Date.now()) {
  if (!iso) return '—';
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  return s < 60 ? `hace ${s} s` : s < 3600 ? `hace ${Math.round(s / 60)} min` : s < 86400 ? `hace ${Math.round(s / 3600)} h` : `hace ${Math.round(s / 86400)} d`;
}
export const COUNTRY = new Intl.DisplayNames(['es'], { type: 'region' });
export const countryName = (cc: string) => { try { return cc === '??' ? 'Desconocido' : COUNTRY.of(cc) || cc; } catch { return cc; } };
