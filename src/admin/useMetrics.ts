import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

type Row = Record<string, unknown>;
const fmtDate = (v: unknown) => {
  if (!v || typeof v !== 'string') return '—';
  const d = new Date(v);
  return isNaN(+d) ? '—' : d.toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};
const pick = (o: Row, ...k: string[]) => {
  for (const key of k) { const v = o[key]; if (v !== undefined && v !== null && v !== '') return String(v); }
  return '—';
};
const dur = (s: unknown) => { const n = Number(s) || 0; return !n ? '0s' : n < 60 ? `${n}s` : `${Math.floor(n / 60)}m`; };

export interface Metrics {
  loading: boolean; error: string;
  visitsTotal: number; uniqueVisitors: number; avgSeconds: number; demosTotal: number;
  leadsTotal: number; replies: number; contactsTotal: number;
  visitsByDay: { day: string; visits: number }[];
  visitRows: string[][]; replyRows: string[][]; contactRows: string[][]; leadRows: string[][];
}

const EMPTY: Metrics = {
  loading: true, error: '', visitsTotal: 0, uniqueVisitors: 0, avgSeconds: 0, demosTotal: 0,
  leadsTotal: 0, replies: 0, contactsTotal: 0, visitsByDay: [], visitRows: [], replyRows: [], contactRows: [], leadRows: [],
};

export function useMetrics(): Metrics {
  const [m, setM] = useState<Metrics>(EMPTY);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setM((s) => ({ ...s, loading: false, error: 'Supabase no configurado' })); return; }
    const from = new Date(Date.now() - 30 * 864e5).toISOString();

    const safe = async (p: PromiseLike<{ data: unknown }>): Promise<Row[]> => {
      try { const { data } = await p; return (data as Row[]) ?? []; } catch { return []; }
    };

    (async () => {
      const [views, demos, replies, contacts, leads] = await Promise.all([
        safe(sb.from('pf_page_views').select('anon_id, area, path, duration_seconds, entered_at').gte('entered_at', from).order('entered_at', { ascending: false }).limit(5000)),
        safe(sb.from('pf_demo_runs').select('demo, created_at').gte('created_at', from).limit(5000)),
        safe(sb.from('pf_email_replies').select('*').order('received_at', { ascending: false }).limit(100)),
        safe(sb.from('pf_contact_messages').select('*').order('created_at', { ascending: false }).limit(100)),
        safe(sb.from('outreach_log').select('company,to_email,status,has_reply,replied_at,sent_at,subject').order('sent_at', { ascending: false }).limit(500)),
      ]);

      const uniq = new Set(views.map((v) => v.anon_id as string));
      const durs = views.map((v) => Number(v.duration_seconds) || 0).filter((d) => d > 0);
      const avg = durs.length ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length) : 0;

      const dayMap = new Map<string, number>();
      for (const v of views) { const d = String(v.entered_at).slice(0, 10); dayMap.set(d, (dayMap.get(d) ?? 0) + 1); }
      const visitsByDay: { day: string; visits: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
        visitsByDay.push({ day: d, visits: dayMap.get(d) ?? 0 });
      }

      const repliesFromLeads = leads.filter((l) => l.has_reply === true).length;

      setM({
        loading: false, error: '',
        visitsTotal: views.length, uniqueVisitors: uniq.size, avgSeconds: avg, demosTotal: demos.length,
        leadsTotal: leads.length, replies: replies.length + repliesFromLeads, contactsTotal: contacts.length,
        visitsByDay,
        visitRows: views.slice(0, 30).map((v) => [String(v.anon_id ?? '').slice(0, 8), String(v.area ?? ''), pick(v, 'path'), dur(v.duration_seconds), fmtDate(v.entered_at)]),
        replyRows: replies.slice(0, 25).map((r) => [`${pick(r, 'from_name')} · ${pick(r, 'from_email')}`, pick(r, 'subject'), pick(r, 'body_preview').slice(0, 120), fmtDate(r.received_at)]),
        contactRows: contacts.slice(0, 25).map((c) => [pick(c, 'name'), `${pick(c, 'email')} ${pick(c, 'phone') !== '—' ? '· ' + pick(c, 'phone') : ''}`, pick(c, 'message').slice(0, 120), fmtDate(c.created_at)]),
        leadRows: leads.slice(0, 25).map((l) => [pick(l, 'company'), pick(l, 'to_email'), pick(l, 'status'), l.has_reply === true ? '✅' : '—', fmtDate(l.sent_at)]),
      });
    })();
  }, []);

  return m;
}
