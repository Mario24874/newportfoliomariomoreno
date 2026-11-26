// Componentes de visualización del panel (SVG/HTML planos, sin librerías). Reglas del skill dataviz: marcas finas (barra <=24 px con extremo
// redondeado de 4 px y base recta, línea 2 px, punto >=8 px con anillo de 2 px del color de la superficie), cuadrícula recesiva, leyenda siempre
// con >=2 series, tooltip en hover y foco, vista de tabla, texto en tokens de texto (nunca en el color de la serie).
import React, { useLayoutEffect, useRef, useState } from 'react';
import type { Kpi } from './api';
import { T, fmtNum } from './theme';

const font = { fontFamily: T.font } as const;

/** Ancho real del contenedor: los SVG se dibujan a tamaño de píxel (el texto no se encoge en móvil). */
function useWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const upd = () => setW(Math.max(260, Math.round(el.clientWidth)));
    upd(); const ro = new ResizeObserver(upd); ro.observe(el); return () => ro.disconnect();
  }, []);
  return [ref, w];
}

export function Card({ title, right, children, pad = true }: { title?: string; right?: React.ReactNode; children: React.ReactNode; pad?: boolean }) {
  return (
    <section style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, minWidth: 0, ...font }}>
      {(title || right) && (
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '14px 16px 0' }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.sub, letterSpacing: 0.2 }}>{title}</h3>{right}
        </header>
      )}
      <div style={{ padding: pad ? 16 : 0 }}>{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, padding: '18px 4px', color: T.muted, fontSize: 13, lineHeight: 1.5, ...font }}>{children}</p>;
}

/* ---------- KPI ---------- */
export function Delta({ kpi, upIsGood = true }: { kpi: Kpi; upIsGood?: boolean }) {
  if (kpi.d === null) return <span style={{ color: T.muted, fontSize: 12 }}>sin periodo previo</span>;
  if (kpi.d === 0) return <span style={{ color: T.muted, fontSize: 12 }}>■ sin cambios</span>;
  const up = kpi.d > 0, good = up === upIsGood;
  return <span style={{ color: good ? T.good : T.critical, fontSize: 12, fontWeight: 600 }}>{up ? '▲' : '▼'} {Math.abs(kpi.d).toLocaleString('es-VE')} %<span style={{ color: T.muted, fontWeight: 400 }}> vs periodo previo</span></span>;
}

export function Tile({ label, kpi, fmt = fmtNum, upIsGood = true, hero = false, hint }: { label: string; kpi: Kpi; fmt?: (n: number) => string; upIsGood?: boolean; hero?: boolean; hint?: string }) {
  return (
    <div title={hint} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: hero ? '20px 22px' : '14px 16px', minWidth: 0, ...font }}>
      <div style={{ fontSize: 12.5, color: T.muted }}>{label}</div>
      <div style={{ fontSize: hero ? 52 : 28, fontWeight: 650, color: T.text, lineHeight: 1.1, margin: '6px 0 6px', letterSpacing: -0.5 }}>{fmt(kpi.v)}</div>
      <Delta kpi={kpi} upIsGood={upIsGood} />
    </div>
  );
}

/* ---------- tooltip ---------- */
interface TipState { x: number; y: number; title: string; rows: { color?: string; label: string; value: string }[] }
function TipBox({ tip }: { tip: TipState | null }) {
  if (!tip) return null;
  return (
    <div role="status" style={{ position: 'absolute', left: tip.x, top: tip.y, transform: 'translate(-50%, -112%)', pointerEvents: 'none', zIndex: 5, background: T.raised, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 10px', minWidth: 120, boxShadow: '0 6px 24px rgba(0,0,0,.45)', ...font }}>
      <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 4 }}>{tip.title}</div>
      {tip.rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
          {r.color && <span style={{ width: 12, height: 2, background: r.color, borderRadius: 1, flex: 'none' }} />}
          <span style={{ color: T.text, fontWeight: 650 }}>{r.value}</span><span style={{ color: T.sub }}>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

function niceMax(m: number) {
  if (m <= 4) return 4;
  const p = Math.pow(10, Math.floor(Math.log10(m))), f = m / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}
const barPath = (x: number, y: number, w: number, h: number, r = 4) => { const rr = Math.min(r, w / 2, h); return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`; };

export function Legend({ items }: { items: { name: string; color: string; kind?: 'line' | 'bar' }[] }) {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', ...font }}>
      {items.map((it) => (
        <span key={it.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.sub }}>
          <span style={it.kind === 'bar' ? { width: 10, height: 10, borderRadius: 2, background: it.color } : { width: 14, height: 2, borderRadius: 1, background: it.color }} />{it.name}
        </span>
      ))}
    </div>
  );
}

/* ---------- serie temporal: visitas (área+línea) y únicos (línea) ---------- */
export interface Pt { t: string; visits: number; uniques: number }
export function TimeChart({ data, hourly }: { data: Pt[]; hourly: boolean }) {
  const [tip, setTip] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const [box, W] = useWidth();
  const H = 250, L = 38, R = 14, TOP = 14, B = 26;
  const max = niceMax(Math.max(1, ...data.map((d) => d.visits)));
  const X = (i: number) => L + (data.length <= 1 ? 0 : (i / (data.length - 1)) * (W - L - R));
  const Y = (v: number) => TOP + (1 - v / max) * (H - TOP - B);
  const line = (k: 'visits' | 'uniques') => data.map((d, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(d[k]).toFixed(1)}`).join('');
  const lab = (t: string) => (hourly ? t.slice(11, 16) : `${t.slice(8, 10)}/${t.slice(5, 7)}`);
  const step = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor((W - L) / 64))));
  const ticks = [0, 1, 2, 3, 4].map((k) => (max * k) / 4);
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTip(Math.max(0, Math.min(data.length - 1, Math.round(((e.clientX - r.left - L) / (W - L - R)) * (data.length - 1)))));
  };
  const last = data.length - 1;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <Legend items={[{ name: 'Visitas', color: T.series[0] }, { name: 'Visitantes únicos', color: T.series[1] }]} />
        <button onClick={() => setTable((v) => !v)} style={{ background: 'none', border: `1px solid ${T.border}`, color: T.sub, fontSize: 12, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', ...font }}>{table ? 'Ver gráfico' : 'Ver como tabla'}</button>
      </div>
      {table ? (
        <div style={{ maxHeight: 260, overflow: 'auto' }}><DataTable head={[hourly ? 'Hora (Caracas)' : 'Día (Caracas)', 'Visitas', 'Únicos']} rows={data.map((d) => [lab(d.t), String(d.visits), String(d.uniques)])} empty="Sin datos" /></div>
      ) : (
        <div ref={box} style={{ position: 'relative' }}>
          <svg width={W} height={H} role="img" aria-label={`Visitas y visitantes únicos por ${hourly ? 'hora' : 'día'}; total ${data.reduce((a, d) => a + d.visits, 0)} visitas`}
            onPointerMove={onMove} onPointerLeave={() => setTip(null)} style={{ display: 'block', touchAction: 'pan-y' }}>
            {ticks.map((v) => (<g key={v}><line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke={T.grid} strokeWidth={1} /><text x={L - 8} y={Y(v) + 4} textAnchor="end" fontSize={11} fill={T.muted} style={font}>{fmtNum(Math.round(v))}</text></g>))}
            {data.map((d, i) => (i % step === 0 || i === last) && <text key={i} x={X(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'} fontSize={11} fill={T.muted} style={font}>{lab(d.t)}</text>)}
            {data.length > 0 && <path d={`${line('visits')}L${X(last)},${Y(0)}L${X(0)},${Y(0)}Z`} fill={T.series[0]} opacity={0.1} />}
            <path d={line('uniques')} fill="none" stroke={T.series[1]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            <path d={line('visits')} fill="none" stroke={T.series[0]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {data.length > 0 && <circle cx={X(last)} cy={Y(data[last].visits)} r={4} fill={T.series[0]} stroke={T.card} strokeWidth={2} />}
            {tip !== null && <g><line x1={X(tip)} x2={X(tip)} y1={TOP} y2={H - B} stroke={T.muted} strokeWidth={1} />
              <circle cx={X(tip)} cy={Y(data[tip].visits)} r={4} fill={T.series[0]} stroke={T.card} strokeWidth={2} />
              <circle cx={X(tip)} cy={Y(data[tip].uniques)} r={4} fill={T.series[1]} stroke={T.card} strokeWidth={2} /></g>}
          </svg>
          <TipBox tip={tip !== null ? { x: Math.min(Math.max(X(tip), 70), W - 70), y: Y(data[tip].visits), title: lab(data[tip].t) + (hourly ? ' h' : ''), rows: [{ color: T.series[0], label: 'visitas', value: String(data[tip].visits) }, { color: T.series[1], label: 'únicos', value: String(data[tip].uniques) }] } : null} />
        </div>
      )}
    </div>
  );
}

/* ---------- columnas (horas del día, envíos por día) ---------- */
export function Columns({ values, labels, unit, color = T.series[0] }: { values: number[]; labels: string[]; unit: string; color?: string }) {
  const [tip, setTip] = useState<number | null>(null);
  const [box, W] = useWidth();
  const H = 190, L = 30, B = 22, TOP = 10, n = values.length;
  const max = niceMax(Math.max(1, ...values)), band = (W - L - 6) / n, bw = Math.min(24, band * 0.62);
  const Y = (v: number) => TOP + (1 - v / max) * (H - TOP - B);
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor((W - L) / 38))));
  return (
    <div ref={box} style={{ position: 'relative' }}>
      <svg width={W} height={H} role="img" aria-label={`Columnas de ${unit}`} style={{ display: 'block' }}>
        {[0, 0.5, 1].map((f) => (<g key={f}><line x1={L} x2={W - 6} y1={Y(max * f)} y2={Y(max * f)} stroke={T.grid} strokeWidth={1} /><text x={L - 6} y={Y(max * f) + 4} textAnchor="end" fontSize={10.5} fill={T.muted} style={font}>{fmtNum(Math.round(max * f))}</text></g>))}
        {values.map((v, i) => {
          const x = L + band * i + (band - bw) / 2, h = Math.max(0, (H - B) - Y(v));
          return (<g key={i} tabIndex={0} onPointerMove={() => setTip(i)} onFocus={() => setTip(i)} onPointerLeave={() => setTip(null)} onBlur={() => setTip(null)} style={{ outline: 'none', cursor: 'default' }}>
            <rect x={L + band * i} y={TOP} width={band} height={H - TOP - B} fill="transparent" />
            {v > 0 && <path d={barPath(x, H - B - h, bw, h)} fill={color} opacity={tip !== null && tip !== i ? 0.55 : 1} />}
            {i % every === 0 && <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize={10.5} fill={T.muted} style={font}>{labels[i]}</text>}
          </g>);
        })}
      </svg>
      <TipBox tip={tip !== null ? { x: Math.min(Math.max(L + band * (tip + 0.5), 60), W - 60), y: Y(values[tip]), title: labels[tip], rows: [{ label: unit, value: String(values[tip]) }] } : null} />
    </div>
  );
}

/* ---------- lista de barras horizontales (valor en la punta) ---------- */
export function BarList({ rows, fmtName = (s: string) => s, color = T.series[0], empty = 'Sin datos todavía' }: { rows: [string, number][]; fmtName?: (s: string) => string; color?: string; empty?: string }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  const max = Math.max(...rows.map((r) => r[1]), 1), total = rows.reduce((a, r) => a + r[1], 0);
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10, ...font }}>
      {rows.map(([name, v]) => (
        <li key={name} title={`${fmtName(name)}: ${v} (${Math.round((v * 100) / total)} %)`} style={{ display: 'grid', gridTemplateColumns: 'minmax(70px, 34%) 1fr auto', alignItems: 'center', gap: 10, fontSize: 13 }}>
          <span style={{ color: T.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmtName(name)}</span>
          <span style={{ height: 10, display: 'block' }}><span style={{ display: 'block', height: 10, width: `${Math.max(2, (v / max) * 100)}%`, background: color, borderRadius: '0 4px 4px 0' }} /></span>
          <span style={{ color: T.text, fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>{fmtNum(v)}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- barra segmentada fina (un total partido en partes) ---------- */
export function SegBar({ parts, empty = 'Sin datos todavía' }: { parts: [string, number][]; empty?: string }) {
  const total = parts.reduce((a, p) => a + p[1], 0);
  if (!total) return <Empty>{empty}</Empty>;
  return (
    <div style={font}>
      <div role="img" aria-label={parts.map(([n, v]) => `${n} ${Math.round((v * 100) / total)} %`).join(', ')} style={{ display: 'flex', gap: 2, height: 8 }}>
        {parts.filter((p) => p[1] > 0).map(([n, v], i) => <span key={n} title={`${n}: ${v} (${Math.round((v * 100) / total)} %)`} style={{ flex: v, background: T.series[i % 8], borderRadius: 4, minWidth: 6 }} />)}
      </div>
      <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
        {parts.map(([n, v], i) => <li key={n} style={{ fontSize: 12.5, color: T.sub, display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: T.series[i % 8] }} />{n} <b style={{ color: T.text }}>{Math.round((v * 100) / total)} %</b></li>)}
      </ul>
    </div>
  );
}

/* ---------- embudo (rampa ordinal azul) ---------- */
export function Funnel({ stages }: { stages: { name: string; v: number }[] }) {
  const top = Math.max(stages[0]?.v ?? 0, 1);
  if (!stages[0]?.v) return <Empty>El embudo se llena en cuanto haya visitas.</Empty>;
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12, ...font }}>
      {stages.map((s, i) => (
        <li key={s.name} title={`${s.name}: ${s.v} (${Math.round((s.v * 100) / top)} % de las visitas únicas)`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span style={{ color: T.sub }}>{s.name}</span><span style={{ color: T.text, fontWeight: 650 }}>{fmtNum(s.v)} <span style={{ color: T.muted, fontWeight: 400 }}>· {Math.round((s.v * 100) / top)} %</span></span></div>
          <div style={{ height: 14, background: T.raised, borderRadius: 4 }}><div style={{ height: 14, width: `${Math.max(s.v ? 2 : 0, (s.v / top) * 100)}%`, background: T.funnel[Math.min(i, 2)], borderRadius: 4 }} /></div>
        </li>
      ))}
    </ul>
  );
}

/* ---------- estado con icono + texto (nunca solo color) ---------- */
export function Status({ ok, okText = 'Operativo', badText = 'Con problemas' }: { ok: boolean; okText?: string; badText?: string }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: ok ? T.good : T.critical, ...font }}>{ok ? '✔' : '✖'} {ok ? okText : badText}</span>;
}

export function DataTable({ head, rows, empty }: { head: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, ...font }}>
        <thead><tr>{head.map((h) => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: T.muted, fontSize: 11.5, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ padding: '9px 10px', color: T.sub, borderBottom: `1px solid ${T.grid}`, verticalAlign: 'top' }}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
