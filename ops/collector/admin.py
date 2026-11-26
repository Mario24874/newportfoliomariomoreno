"""API del portal admin v2 del portfolio — agregados y consultas. SIN IA, SOLO librería estándar. Se monta en el servicio `portfolio-collector` (rutas /admin/*).
Todas las consultas leen las tablas `pf_*` (y `outreach_log`, solo lectura) con la service_role; el acceso lo protege collector.py verificando el JWT de Supabase
del owner. Las horas del panel van en America/Caracas (UTC-4 fijo, sin horario de verano); los instantes se devuelven en UTC (ISO)."""
import csv, io, json, os, re, time, urllib.error, urllib.parse, urllib.request
from collections import Counter
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

TZ = timedelta(hours=-4)
RANGES = {"24h": 24, "7d": 168, "30d": 720, "90d": 2160}
ALERTS = os.environ.get("N8N_ALERTS", "/etc/easypanel/projects/n8n/n8n/volumes/data/alerts/alerts.jsonl")
EVENTOS = os.environ.get("AVISADOR_EVENTOS", "/var/lib/avisador/eventos.jsonl")
HISTORICO = os.environ.get("CF_HISTORICO", "/var/lib/portfolio-collector/cf-historico.json")
SITES = [("Sitio", "https://mariomoreno.work/", 200), ("Colector", "https://t.mariomoreno.work/salud", 200),
         ("Avisador", "https://avisos.mariomoreno.work/salud", 200), ("n8n", "https://n8n-n8n.qr7yo1.easypanel.host/healthz", 200)]
RULES = [("✉️ Mensaje de contacto", "inmediato (nombre + mensaje; sin correo ni teléfono)"), ("✉️ Reseña n/5", "inmediato"),
         ("ℹ️ Clic en WhatsApp", "1 por visitante y hora"), ("ℹ️ Pico de tráfico", "≥15 visitantes distintos en 60 min, máx. 1 cada 3 h"),
         ("🔴 Fallo de demo de un visitante", "n8n; 30 min de antirrepetición, tope 20/h"), ("🔴 El colector no puede guardar", "inmediato (30 min de antirrepetición)"),
         ("ℹ️ Resumen diario", "12:05 UTC (08:05 Caracas)")]
UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")


def now_utc():
    return datetime.now(timezone.utc)


def parse_ts(s):
    return datetime.fromisoformat(str(s).replace("Z", "+00:00"))


def iso(d):
    return d.astimezone(timezone.utc).isoformat()


def ua_info(ua):
    ua = ua or ""
    dev = "tablet" if re.search(r"iPad|Tablet", ua) else "móvil" if re.search(r"Mobi|Android|iPhone", ua) else "escritorio"
    br = "Edge" if "Edg" in ua else "Opera" if "OPR" in ua else "Firefox" if "Firefox" in ua else "Chrome" if ("Chrome" in ua or "CriOS" in ua) else "Safari" if "Safari" in ua else "otro"
    return dev, br


def split_path(path):
    p = path or "/"
    base, _, q = p.partition("?")
    utm = re.search(r"(?:^|&)utm_source=([^&]+)", q)
    return base or "/", (utm.group(1)[:40] if utm else None)


def source_of(path, referrer):
    _, utm = split_path(path)
    if utm:
        return utm
    host = urlparse(referrer or "").netloc.lower().removeprefix("www.")
    return host if host and host != "mariomoreno.work" else "directo"


def delta(cur, prev):
    return None if prev in (0, None) else round((cur - prev) * 100 / prev, 1)


def kpi(cur, prev):
    return {"v": cur, "p": prev, "d": delta(cur, prev)}


def period_stats(views, demos, msgs, prev_uniq=frozenset()):
    uniq = {v["anon_id"] for v in views}
    durs = [v["duration_seconds"] for v in views if v.get("duration_seconds")]
    short = sum(1 for v in views if not v.get("duration_seconds") or v["duration_seconds"] < 10)
    real = [d for d in demos if not str(d["demo"]).startswith("click:")]
    contacts = [m for m in msgs if m.get("source") != "review"]
    reviews = [m for m in msgs if m.get("source") == "review"]
    return {"visits": len(views), "uniques": len(uniq), "returning": len(uniq & prev_uniq),
            "avg_seconds": round(sum(durs) / len(durs)) if durs else 0, "short_pct": round(short * 100 / len(views), 1) if views else 0.0,
            "demo_runs": len(real), "demo_visitors": len({d["anon_id"] for d in real if d.get("anon_id")}),
            "contacts": len(contacts), "reviews": len(reviews), "whatsapp": sum(1 for d in demos if d["demo"] == "click:whatsapp"),
            "uniq_set": uniq}


def summarize(views_all, demos_all, msgs_all, rng, now=None):
    """Núcleo puro (testeable): recibe filas de 2 periodos y devuelve el JSON de /admin/summary."""
    now = now or now_utc(); hours = RANGES[rng]
    start, prev_start = now - timedelta(hours=hours), now - timedelta(hours=2 * hours)
    inr = lambda rows, col, a, b: [r for r in rows if a <= parse_ts(r[col]) < b]  # noqa: E731
    v, pv = inr(views_all, "entered_at", start, now + timedelta(seconds=1)), inr(views_all, "entered_at", prev_start, start)
    d, pd = inr(demos_all, "created_at", start, now + timedelta(seconds=1)), inr(demos_all, "created_at", prev_start, start)
    m, pm = inr(msgs_all, "created_at", start, now + timedelta(seconds=1)), inr(msgs_all, "created_at", prev_start, start)
    prev = period_stats(pv, pd, pm); cur = period_stats(v, d, m, prev["uniq_set"])
    kp = {k: kpi(cur[k], prev[k]) for k in ("visits", "uniques", "avg_seconds", "short_pct", "demo_runs", "contacts", "reviews", "whatsapp")}
    kp["returning"] = {"v": cur["returning"], "p": None, "d": None}
    unread = sum(1 for x in msgs_all if x.get("source") != "review" and x.get("status", "new") == "new")
    kp["unread"] = {"v": unread, "p": None, "d": None}
    # serie: por hora (24 h) o por día, en hora de Caracas (datetimes ingenuos = hora local)
    local = lambda x: (x + TZ).replace(tzinfo=None)  # noqa: E731
    floor = (lambda t: t.replace(minute=0, second=0, microsecond=0)) if rng == "24h" else (lambda t: t.replace(hour=0, minute=0, second=0, microsecond=0))
    step, n = (timedelta(hours=1), 24) if rng == "24h" else (timedelta(days=1), hours // 24)
    cur_b = floor(local(now))
    buckets = {cur_b - step * i: {"visits": 0, "uniq": set()} for i in range(n - 1, -1, -1)}
    for r in v:
        t = floor(local(parse_ts(r["entered_at"])))
        if t in buckets:
            buckets[t]["visits"] += 1; buckets[t]["uniq"].add(r["anon_id"])
    series = [{"t": k.isoformat(), "visits": b["visits"], "uniques": len(b["uniq"])} for k, b in sorted(buckets.items())]
    hours_hist = [0] * 24
    for r in v:
        hours_hist[(parse_ts(r["entered_at"]) + TZ).hour] += 1
    pages = Counter(split_path(r["path"])[0] for r in v)
    srcs = Counter(source_of(r["path"], r.get("referrer")) for r in v)
    devs = Counter(ua_info(r.get("user_agent"))[0] for r in v)
    brs = Counter(ua_info(r.get("user_agent"))[1] for r in v)
    ctry = Counter(r.get("country") or "??" for r in v)
    cu = cur["uniques"]
    return {"range": rng, "generated_at": iso(now), "tz": "America/Caracas (UTC-4)", "kpis": kp, "series": series, "hours": hours_hist,
            "countries": ctry.most_common(10), "pages": pages.most_common(10), "sources": srcs.most_common(10), "devices": dict(devs), "browsers": dict(brs),
            "funnel": {"visitors": cu, "demo": cur["demo_visitors"], "contact": len({x["anon_id"] for x in m if x.get("source") != "review" and x.get("anon_id")})},
            "empty": len(v) == 0}


def live(views_recent, now=None):
    now = now or now_utc(); five = now - timedelta(minutes=5)
    last = sorted(views_recent, key=lambda r: r["entered_at"], reverse=True)
    act = {r["anon_id"] for r in last if parse_ts(r["entered_at"]) >= five}
    return {"generated_at": iso(now), "active_5min": len(act),
            "last": [{"path": split_path(r["path"])[0], "country": r.get("country") or "??", "device": ua_info(r.get("user_agent"))[0],
                      "source": source_of(r["path"], r.get("referrer")), "at": r["entered_at"]} for r in last[:10]]}


def read_jsonl_tail(path, n=400):
    try:
        with open(path, "rb") as f:
            f.seek(0, 2); size = f.tell(); f.seek(max(0, size - 200000))
            lines = f.read().decode("utf8", "ignore").splitlines()[-n:]
    except OSError:
        return []
    out = []
    for ln in lines:
        try:
            out.append(json.loads(ln))
        except ValueError:
            pass
    return out


def demos_report(demos_rows, rng, now=None, alerts=None):
    now = now or now_utc(); start = now - timedelta(hours=RANGES[rng])
    real = [d for d in demos_rows if not str(d["demo"]).startswith("click:") and parse_ts(d["created_at"]) >= start]
    por = Counter(d["demo"] for d in real)
    alerts = alerts if alerts is not None else read_jsonl_tail(ALERTS)
    fallos = [a for a in alerts if a.get("source") == "visitor" and a.get("ts") and parse_ts(a["ts"]) >= start]
    return {"range": rng, "by_demo": por.most_common(), "total": len(real),
            "recent": [{"demo": d["demo"], "input": (d.get("input_preview") or "")[:120], "at": d["created_at"]} for d in sorted(real, key=lambda r: r["created_at"], reverse=True)[:20]],
            "failures": {"total": len(fallos), "by_demo": Counter(a.get("demo") for a in fallos).most_common(),
                         "recent": [{"demo": a.get("demo"), "status": a.get("status"), "message": (a.get("message") or "")[:140], "at": a["ts"]} for a in fallos[-10:][::-1]]}}


def rating_of(msg):
    m = re.match(r"^\[(\d)/5\]", msg or "")
    return int(m.group(1)) if m else None


def messages_view(rows, status=None, kind=None, q=None, limit=200):
    out = []
    for r in sorted(rows, key=lambda x: x["created_at"], reverse=True):
        is_rev = r.get("source") == "review"
        if kind == "contacto" and is_rev or kind == "resena" and not is_rev:
            continue
        if status and r.get("status") != status:
            continue
        hay = " ".join(str(r.get(k) or "") for k in ("name", "email", "message")).lower()
        if q and q.lower() not in hay:
            continue
        out.append({"id": r["id"], "kind": "resena" if is_rev else "contacto", "name": r.get("name"), "email": r.get("email"), "phone": r.get("phone"),
                    "message": r.get("message"), "rating": rating_of(r.get("message")) if is_rev else None, "status": r.get("status"), "at": r["created_at"]})
    return out[:limit]


def messages_csv(items):
    buf = io.StringIO(); w = csv.writer(buf)
    w.writerow(["fecha_utc", "tipo", "estado", "nombre", "correo", "telefono", "puntuacion", "mensaje"])
    for i in items:
        w.writerow([i["at"], i["kind"], i["status"], i["name"] or "", i["email"] or "", i["phone"] or "", i["rating"] or "", (i["message"] or "").replace("\n", " ")])
    return buf.getvalue()


def captacion_report(rows, now=None):
    now = now or now_utc(); c14 = now - timedelta(days=14)
    sent = [r for r in rows if r.get("sent_at")]
    replied = [r for r in sent if r.get("has_reply")]
    por_dia = Counter((parse_ts(r["sent_at"]) + TZ).date().isoformat() for r in sent if parse_ts(r["sent_at"]) >= c14)
    dias = [((now + TZ).date() - timedelta(days=i)).isoformat() for i in range(13, -1, -1)]
    return {"sent": len(sent), "replied": len(replied), "reply_rate": round(len(replied) * 100 / len(sent), 1) if sent else 0.0,
            "by_status": Counter(r.get("status") or "?" for r in sent).most_common(), "by_country": Counter(r.get("country") or "??" for r in sent).most_common(6),
            "by_day": [{"day": d, "sent": por_dia.get(d, 0)} for d in dias],
            "replies": [{"company": r.get("company"), "at": r.get("replied_at"), "subject": (r.get("subject") or "")[:80]} for r in sorted(replied, key=lambda x: x.get("replied_at") or "", reverse=True)[:10]]}


def campana_report(envios, prospectos, supresion, eventos, config, lotes, now=None):
    """Campaña V2 (tablas c2_*): lo que se envía HOY. Los envíos de ensayo (ensayo=true) se cuentan aparte y no entran en las métricas."""
    now = now or now_utc(); c14 = now - timedelta(days=14)
    reales = [e for e in envios if not e.get("ensayo")]
    ensayos = [e for e in envios if e.get("ensayo")]
    por_dia = Counter((parse_ts(e["enviado_at"]) + TZ).date().isoformat() for e in reales if e.get("enviado_at") and parse_ts(e["enviado_at"]) >= c14)
    dias = [((now + TZ).date() - timedelta(days=i)).isoformat() for i in range(13, -1, -1)]
    tipos = Counter(e.get("tipo") for e in eventos)
    cfg = {c["clave"]: c["valor"] for c in config}
    ult = max((e["enviado_at"] for e in reales if e.get("enviado_at")), default=None)
    # Las respuestas SÍ se guardan: vigilar_respuestas.py pasa al prospecto a «respondio» y registra el evento «respuesta» en c2_eventos.
    contactados = {e["prospecto_id"] for e in reales if e.get("prospecto_id")}
    respondieron = sum(1 for p in prospectos if p.get("estado") == "respondio")
    return {"sent": len(reales), "trial_sent": len(ensayos), "last_sent": ult,
            "delivered": sum(1 for e in reales if e.get("estado_entrega") == "entregado"),
            "bounced": sum(1 for e in reales if e.get("rebote_tipo")),
            "by_touch": sorted(Counter(f"Toque {e.get('toque')}" for e in reales).items()),
            "by_delivery": Counter(e.get("estado_entrega") or "?" for e in reales).most_common(),
            "by_day": [{"day": d, "sent": por_dia.get(d, 0)} for d in dias],
            "prospects": {"total": len(prospectos), "by_state": Counter(p.get("estado") for p in prospectos).most_common(),
                          "by_cell": Counter(p.get("celda") for p in prospectos).most_common(),
                          "by_channel": Counter(p.get("canal") or "sin canal" for p in prospectos).most_common()},
            "suppressed": {"total": len(supresion), "by_reason": Counter(x.get("motivo") for x in supresion).most_common()},
            "batches": Counter(l.get("estado") for l in lotes).most_common(),
            "paused": str(cfg.get("pausa", "")).lower() in ("true", "1", "si", "sí"), "start_date": cfg.get("fecha_inicio"),
            "unmatched_resend_events": tipos.get("resend_sin_envio", 0),
            "recent_events": [{"at": e["creado"], "type": e["tipo"], "detail": json.dumps(e.get("detalle"), ensure_ascii=False)[:120] if e.get("detalle") else ""}
                              for e in eventos if e.get("tipo") != "resend_sin_envio"][:12],
            "contacted": len(contactados), "replied": respondieron, "reply_rate": round(respondieron * 100 / len(contactados), 1) if contactados else 0.0,
            "replies_tracked": True}


def historico_report(data, dias=30, hoy=None):
    """Historial de Cloudflare (cf_historico.py): serie de la zona (exacta) y del portfolio (ESTIMACIÓN sin VPS, robots ni ráfagas). `data` es el JSON del archivo."""
    hoy = hoy or now_utc().date()
    desde = (hoy - timedelta(days=dias)).isoformat()
    zona = [{"date": d, **v} for d, v in sorted((data.get("zona") or {}).items()) if d >= desde]
    port = [{"date": d, **v} for d, v in sorted((data.get("portfolio") or {}).items()) if d >= desde]
    paises = Counter()
    for p in port:
        for pais, n in p.get("paises", []):
            paises[pais] += n
    suma = lambda k: sum(p.get(k, 0) for p in port)  # noqa: E731
    return {"generated_at": data.get("generated_at"), "days": dias, "empty": not zona and not port, "notas": data.get("notas", {}),
            "zona": zona, "portfolio": port,
            "totales": {"cargas_bruto": suma("cargas_bruto"), "cargas": suma("cargas"), "descartadas_vps": suma("descartadas_vps"),
                        "descartadas_bots": suma("descartadas_bots"), "descartadas_rafaga": suma("descartadas_rafaga"),
                        "ips_por_dia": round(suma("ips_unicas") / len(port)) if port else 0, "dias": len(port)},
            "paises": paises.most_common(8)}


def probe(name, url, ok):
    t0 = time.time()
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "portfolio-admin-probe"})
        with urllib.request.urlopen(req, timeout=8) as r:
            code = r.status
    except urllib.error.HTTPError as e:
        code = e.code
    except Exception:
        code = 0
    return {"name": name, "ok": code == ok, "code": code, "ms": round((time.time() - t0) * 1000)}


def demo_smoke(alerts=None):
    """Último estado conocido de cada demo según el monitor de n8n (alerts.jsonl solo registra fallos y recuperaciones). Se evita leer la BD de n8n
    (en modo WAL y con el sistema de archivos del servicio en solo lectura daría datos viejos o fallaría)."""
    last = {}
    for al in (alerts if alerts is not None else read_jsonl_tail(ALERTS, 3000)):
        if al.get("source") == "monitor" and str(al.get("check", "")).startswith("demo "):
            last[al["check"][5:]] = al
    return [{"name": k, "ok": v.get("severity") in ("recovered", "ok"), "status": v.get("severity"), "at": v.get("ts")} for k, v in sorted(last.items())]


def salud_report():
    al = [a for a in read_jsonl_tail(ALERTS, 60)][-12:][::-1]
    return {"generated_at": iso(now_utc()), "sites": [probe(*s) for s in SITES], "demos": demo_smoke(),
            "alerts": [{"at": a.get("ts"), "source": a.get("source"), "severity": a.get("severity"), "what": a.get("check") or a.get("demo") or a.get("workflow") or "",
                        "message": (a.get("message") or "")[:140]} for a in al]}


def avisos_report(events=None):
    ev = events if events is not None else read_jsonl_tail(EVENTOS, 600)
    mine = [e for e in ev if e.get("proyecto") == "Portfolio"][-40:][::-1]
    return {"rules": [{"name": n, "when": w} for n, w in RULES],
            "recent": [{"at": datetime.fromtimestamp(e["t"], timezone.utc).isoformat(), "type": e.get("tipo"), "title": e.get("titulo"), "state": e.get("estado")} for e in mine]}


# ---------- enrutado (puro: recibe la BD; la autenticación la hace collector.py) ----------
_cache = {}
TTL = {"/admin/summary": 10, "/admin/demos": 10, "/admin/captacion": 60, "/admin/campana": 60, "/admin/historico": 60, "/admin/salud": 30, "/admin/avisos": 10, "/admin/live": 4}


def since(col, dt):
    return f"{col}=gte.{urllib.parse.quote(iso(dt))}"


def route(db, method, path, params, body=None, now=None):
    """Devuelve (código, payload, tipo). payload es dict/list (JSON) o str (CSV)."""
    now = now or now_utc()
    if method == "GET" and path in TTL:
        key = (path, tuple(sorted(params.items())))
        hit = _cache.get(key)
        if hit and time.time() - hit[0] < TTL[path]:
            return 200, hit[1], "json"
    out = _route(db, method, path, params, body, now)
    if method == "GET" and path in TTL and out[0] == 200:
        _cache[(path, tuple(sorted(params.items())))] = (time.time(), out[1])
        if len(_cache) > 200:
            _cache.clear()
    return out


def _route(db, method, path, params, body, now):
    rng = params.get("range", "7d")
    if method == "GET" and path in ("/admin/summary", "/admin/demos") and rng not in RANGES:
        return 400, {"error": "range"}, "json"
    if method == "GET":
        if path == "/admin/summary":
            a = now - timedelta(hours=2 * RANGES[rng])
            return 200, summarize(db.select_all("pf_page_views", "select=anon_id,path,referrer,user_agent,country,duration_seconds,entered_at&" + since("entered_at", a) + "&order=entered_at.asc"),
                                  db.select_all("pf_demo_runs", "select=anon_id,demo,created_at&" + since("created_at", a)),
                                  db.select_all("pf_contact_messages", "select=id,anon_id,source,status,message,created_at"), rng, now), "json"
        if path == "/admin/live":
            return 200, live(db.select_all("pf_page_views", "select=anon_id,path,referrer,user_agent,country,entered_at&" + since("entered_at", now - timedelta(minutes=30)) + "&order=entered_at.desc&limit=500"), now), "json"
        if path == "/admin/demos":
            return 200, demos_report(db.select_all("pf_demo_runs", "select=anon_id,demo,input_preview,created_at&" + since("created_at", now - timedelta(hours=RANGES[rng]))), rng, now), "json"
        if path in ("/admin/messages", "/admin/messages.csv"):
            st = params.get("status") if params.get("status") in ("new", "read", "archived") else None
            kind = params.get("kind") if params.get("kind") in ("contacto", "resena") else None
            try:
                lim = max(1, min(int(params.get("limit", "200")), 1000))
            except ValueError:
                lim = 200
            items = messages_view(db.select_all("pf_contact_messages", "select=*"), st, kind, (params.get("q") or "")[:100] or None, lim)
            return (200, messages_csv(items), "csv") if path.endswith(".csv") else (200, {"items": items, "total": len(items)}, "json")
        if path == "/admin/captacion":
            return 200, captacion_report(db.select_all("outreach_log", "select=sent_at,status,has_reply,replied_at,company,country,subject&order=sent_at.desc"), now), "json"
        if path == "/admin/campana":
            return 200, campana_report(db.select_all("c2_envios", "select=prospecto_id,toque,enviado_at,estado_entrega,rebote_tipo,ensayo&order=enviado_at.desc"),
                                       db.select_all("c2_prospectos", "select=estado,celda,canal"), db.select_all("c2_supresion", "select=motivo"),
                                       db.select_all("c2_eventos", "select=creado,tipo,detalle&order=creado.desc&limit=1000"), db.select_all("c2_config", "select=clave,valor"),
                                       db.select_all("c2_lotes", "select=estado"), now), "json"
        if path == "/admin/historico":
            try:
                dias = max(1, min(int(params.get("days", "30")), 400))
            except ValueError:
                dias = 30
            try:
                data = json.load(open(HISTORICO, encoding="utf-8"))
            except (OSError, ValueError):
                data = {}
            return 200, historico_report(data, dias), "json"
        if path == "/admin/salud":
            return 200, salud_report(), "json"
        if path == "/admin/avisos":
            return 200, avisos_report(), "json"
        return 404, {"error": "no"}, "json"
    if method == "PATCH":
        m = re.fullmatch(r"/admin/messages/([0-9a-f-]{36})", path)
        if not m or not UUID_RE.match(m.group(1)):
            return 404, {"error": "no"}, "json"
        st = (body or {}).get("status") if isinstance(body, dict) else None
        if st not in ("new", "read", "archived"):
            return 400, {"error": "status"}, "json"
        db.update("pf_contact_messages", {"id": f"eq.{m.group(1)}"}, {"status": st})
        _cache.clear()
        return 200, {"ok": True}, "json"
    return 405, {"error": "método"}, "json"
