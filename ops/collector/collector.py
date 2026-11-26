#!/usr/bin/env python3
"""Colector de analítica del portfolio (mariomoreno.work) — SIN IA, SOLO librería estándar.

Recibe eventos del navegador (POST /t/pv, /t/dur, /t/demo, /t/contact, /t/review, /t/click) y los guarda en las tablas `pf_*` del Supabase del portfolio con la
service_role, así RLS sigue cerrado para anon (el INSERT anónimo con `return=representation` y el PATCH de duración fallaban: 0 visitas guardadas, ver
docs/ADMIN-V2-AUDITORIA-Y-DISENO.md H1/H2). No guarda IP: solo país (cabecera CF-IPCountry de Cloudflare) y el ID anónimo de la cookie.
Filtra bots por User-Agent y limita por IP (en memoria, con sal diaria; nada se escribe a disco).
Escucha en 172.18.0.1:8788 (puerta interna de Docker); Traefik lo publica en https://t.mariomoreno.work (solo /t/* y /salud).
Si Supabase falla, responde 502 y avisa 🔴 al avisador (tema Portfolio; el avisador agrupa repeticiones 30 min).
Secretos: /root/.secrets/supabase-tracker.env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). Nunca en el repo.
"""
import hashlib, json, os, re, sys, threading, time, urllib.error, urllib.parse, urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ENV_FILE = os.environ.get("COLLECTOR_ENV", "/root/.secrets/supabase-tracker.env")
AVISADOR_DIR = os.environ.get("AVISADOR_DIR", "/root/avisador")
ORIGINS = {"https://mariomoreno.work", "https://www.mariomoreno.work", "https://app.mariomoreno.work"}
BOT_RE = re.compile(r"bot|crawl|spider|slurp|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-|httpclient|go-http|java/|axios|node-fetch|preview|facebookexternalhit|whatsapp", re.I)
UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
ANON_RE = re.compile(r"^[A-Za-z0-9_-]{6,64}$")
LIMITS = {"pv": (60, 60), "dur": (120, 60), "demo": (40, 60), "contact": (5, 3600), "review": (3, 3600), "click": (20, 60)}  # (peticiones, ventana s) por IP
MAX_BODY = 8192
SPIKE_N = int(os.environ.get("COLLECTOR_SPIKE_N", "15"))          # visitantes únicos en 60 min que cuentan como pico
SPIKE_COOLDOWN = int(os.environ.get("COLLECTOR_SPIKE_COOLDOWN", "10800"))  # no repetir el aviso de pico en 3 h
CLICK_COOLDOWN = 3600                                              # un aviso de clic en WhatsApp por visitante y hora
_hits = {}
_uniq = {}      # anon_id -> última visita (para el pico de tráfico)
_last = {"spike": None}
_clicks = {}


def spike_check(anon, now):
    """Registra al visitante y devuelve el nº de únicos de la última hora si acaba de cruzar el umbral (con enfriamiento), si no None."""
    _uniq[anon] = now
    for a in [a for a, t in _uniq.items() if now - t > 3600]:
        _uniq.pop(a, None)
    if len(_uniq) >= SPIKE_N and (_last["spike"] is None or now - _last["spike"] > SPIKE_COOLDOWN):
        _last["spike"] = now
        return len(_uniq)
    return None


def clip(v, n):
    return None if v is None else str(v)[:n]


def read_env(path):
    out = {}
    for line in open(path, encoding="utf-8"):
        if "=" in line and not line.lstrip().startswith("#"):
            k, v = line.split("=", 1)
            out[k.strip()] = v.strip().strip('"').strip("'")
    return out


class Db:
    """Cliente mínimo de PostgREST con service_role."""
    def __init__(self, url, key):
        self.url, self.key = url.rstrip("/"), key

    def _req(self, method, path, body=None, prefer=None):
        h = {"apikey": self.key, "Authorization": f"Bearer {self.key}", "Content-Type": "application/json"}
        if prefer:
            h["Prefer"] = prefer
        data = json.dumps(body).encode() if body is not None else None
        r = urllib.request.Request(f"{self.url}/rest/v1/{path}", data=data, method=method, headers=h)
        with urllib.request.urlopen(r, timeout=15) as x:
            raw = x.read()
            return json.loads(raw) if raw else None

    def insert(self, table, row, returning=False):
        return self._req("POST", table, row, "return=representation" if returning else "return=minimal")

    def update(self, table, filters, row):
        return self._req("PATCH", f"{table}?{urllib.parse.urlencode(filters)}", row, "return=minimal")


def rate_ok(kind, ip_hash, now):
    n, win = LIMITS[kind]
    k = (kind, ip_hash)
    arr = [t for t in _hits.get(k, []) if now - t < win]
    if len(arr) >= n:
        _hits[k] = arr
        return False
    arr.append(now); _hits[k] = arr
    if len(_hits) > 20000:  # purga defensiva
        for kk in [kk for kk, v in _hits.items() if not v or now - v[-1] > 3600]:
            _hits.pop(kk, None)
    return True


def handle(kind, data, ua, country, db, emit=None, now=None):
    """Lógica pura (testeable). Devuelve (código, cuerpo_dict). Lanza excepción si Supabase falla.
    `emit(tipo, titulo, detalle)` envía el aviso a Telegram DESPUÉS de guardar; un fallo del aviso nunca afecta a la respuesta."""
    now = time.time() if now is None else now

    def avisar(tipo, titulo, detalle=None):
        if emit:
            try:
                emit(tipo, titulo, detalle)
            except Exception as e:  # noqa: BLE001
                print(f"[collector] aviso no enviado: {e}", file=sys.stderr, flush=True)

    if not isinstance(data, dict):
        return 400, {"error": "json"}
    if kind in ("pv", "demo", "click") and (not ua or BOT_RE.search(ua)):
        return 204, {}
    anon = data.get("anon_id")
    if kind == "pv":
        if not isinstance(anon, str) or not ANON_RE.match(anon):
            return 400, {"error": "anon_id"}
        area = data.get("area", "portfolio")
        if area not in ("portfolio", "app"):
            return 400, {"error": "area"}
        row = {"anon_id": anon, "area": area, "path": clip(data.get("path") or "/", 200), "section": clip(data.get("section"), 120),
               "referrer": clip(data.get("referrer"), 300), "user_agent": clip(ua, 512),
               "country": country if isinstance(country, str) and re.fullmatch(r"[A-Z]{2}", country) else None}
        r = db.insert("pf_page_views", row, returning=True)
        n = spike_check(anon, now)
        if n:
            avisar("info", "Pico de tráfico", f"{n} visitantes distintos en la última hora (umbral {SPIKE_N})")
        return 200, {"id": r[0]["id"] if r else None}
    if kind == "dur":
        vid, secs = data.get("id"), data.get("seconds")
        if not (isinstance(vid, str) and UUID_RE.match(vid) and isinstance(anon, str) and ANON_RE.match(anon)):
            return 400, {"error": "id"}
        if isinstance(secs, bool) or not isinstance(secs, (int, float)) or not (1 <= secs <= 21600):
            return 400, {"error": "seconds"}
        db.update("pf_page_views", {"id": f"eq.{vid}", "anon_id": f"eq.{anon}"}, {"duration_seconds": int(secs)})
        return 204, {}
    if kind == "demo":
        demo = data.get("demo")
        if not isinstance(demo, str) or not re.fullmatch(r"[\w .:/-]{1,60}", demo):
            return 400, {"error": "demo"}
        db.insert("pf_demo_runs", {"anon_id": anon if isinstance(anon, str) and ANON_RE.match(anon) else None, "demo": demo,
                                   "input_preview": clip(data.get("input_preview"), 280)})
        return 204, {}
    if kind == "contact":
        msg = (data.get("message") or "").strip() if isinstance(data.get("message"), str) else ""
        if not msg:
            return 400, {"error": "message"}
        row = {"name": clip(data.get("name"), 120), "email": clip(data.get("email"), 200), "phone": clip(data.get("phone"), 40),
               "message": msg[:4000], "source": "portfolio", "anon_id": anon if isinstance(anon, str) and ANON_RE.match(anon) else None}
        db.insert("pf_contact_messages", row)
        quien = (row["name"] or "sin nombre").strip()
        avisar("mensaje", "Mensaje de contacto", f"{quien}: «{msg[:300]}»\nResponde desde el correo del formulario o el panel admin.")
        return 204, {}
    if kind == "review":
        rating = data.get("rating")
        if isinstance(rating, bool) or not isinstance(rating, int) or not 1 <= rating <= 5:
            return 400, {"error": "rating"}
        comment = (data.get("comment") or "").strip() if isinstance(data.get("comment"), str) else ""
        name = clip((data.get("reviewer_name") or "").strip() if isinstance(data.get("reviewer_name"), str) else "", 80) or None
        # Sin DDL en ese Supabase no hay tabla de reseñas: se guardan en pf_contact_messages con source='review' y «[n/5]» al inicio del mensaje.
        db.insert("pf_contact_messages", {"name": name, "email": None, "phone": None, "message": f"[{rating}/5] {comment[:1000]}".strip(),
                                          "source": "review", "anon_id": anon if isinstance(anon, str) and ANON_RE.match(anon) else None})
        avisar("mensaje", f"Reseña {rating}/5", f"{name or 'anónimo'}" + (f": «{comment[:300]}»" if comment else ""))
        return 204, {}
    if kind == "click":
        target = data.get("target")
        if target != "whatsapp":
            return 400, {"error": "target"}
        a = anon if isinstance(anon, str) and ANON_RE.match(anon) else None
        db.insert("pf_demo_runs", {"anon_id": a, "demo": "click:whatsapp", "input_preview": None})
        if a is None or a not in _clicks or now - _clicks[a] > CLICK_COOLDOWN:
            if a:
                _clicks[a] = now
            avisar("info", "Clic en WhatsApp", f"Un visitante pulsó «Escríbeme por WhatsApp»{' (país ' + country + ')' if isinstance(country, str) and re.fullmatch(r'[A-Z]{2}', country) else ''}")
        return 204, {}
    return 404, {"error": "no"}


def make_handler(db, notify):
    class H(BaseHandler):
        pass
    H.db = db
    H.notify = staticmethod(notify) if notify else None  # staticmethod: si no, Python lo enlaza como método y le pasa `self` de más
    return H


class BaseHandler(BaseHTTPRequestHandler):
    db = None
    notify = None
    server_version = "pf-collector"

    def _cors(self):
        o = self.headers.get("Origin", "")
        if o in ORIGINS:
            self.send_header("Access-Control-Allow-Origin", o)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Access-Control-Max-Age", "86400")

    def _send(self, code, obj=None):
        body = json.dumps(obj).encode() if obj else b""
        self.send_response(code)
        self._cors()
        if body:
            self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if body and self.command != "HEAD":
            self.wfile.write(body)

    def do_OPTIONS(self):
        self._send(204)

    def do_GET(self):
        self._send(200, {"ok": True}) if self.path == "/salud" else self._send(404, {"error": "no"})

    def do_POST(self):
        m = re.fullmatch(r"/t/(pv|dur|demo|contact|review|click)", self.path)
        if not m:
            return self._send(404, {"error": "no"})
        kind = m.group(1)
        if self.headers.get("Origin", "") not in ORIGINS:
            return self._send(403, {"error": "origen"})
        try:
            n = int(self.headers.get("Content-Length", "0"))
            if n <= 0 or n > MAX_BODY:
                return self._send(413, {"error": "tamaño"})
            data = json.loads(self.rfile.read(n))
        except (ValueError, json.JSONDecodeError):
            return self._send(400, {"error": "json"})
        ip = (self.headers.get("CF-Connecting-IP") or (self.headers.get("X-Forwarded-For") or "").split(",")[0].strip() or self.client_address[0])
        salt = time.strftime("%Y-%m-%d", time.gmtime())
        ip_hash = hashlib.sha256(f"{salt}|{ip}".encode()).hexdigest()[:16]
        if not rate_ok(kind, ip_hash, time.time()):
            return self._send(429, {"error": "límite"})
        try:
            # el aviso a Telegram va en un hilo aparte para no retrasar la respuesta al navegador
            emit = (lambda *a: threading.Thread(target=self.notify, args=a, daemon=True).start()) if self.notify else None
            code, obj = handle(kind, data, self.headers.get("User-Agent", ""), self.headers.get("CF-IPCountry"), self.db, emit)
        except Exception as e:  # Supabase caído o rechazo inesperado
            print(f"[collector] ERROR {kind}: {type(e).__name__}: {str(e)[:200]}", file=sys.stderr, flush=True)
            if self.notify:
                try:
                    self.notify("error", "El colector no puede guardar en Supabase", f"{kind}: {type(e).__name__}: {str(e)[:150]}")
                except Exception:
                    pass
            return self._send(502, {"error": "almacenamiento"})
        self._send(code, obj or None)

    def log_message(self, *a):
        pass


def main():
    env = read_env(ENV_FILE)
    db = Db(env["SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"])
    notify = None
    try:
        sys.path.insert(0, AVISADOR_DIR)
        import avisador
        notify = lambda tipo, titulo, detalle=None: avisador.enviar_evento("Portfolio", tipo, titulo, detalle)  # noqa: E731
    except Exception as e:
        print(f"[collector] avisador no disponible: {e}", file=sys.stderr)
    host, port = os.environ.get("COLLECTOR_HOST", "127.0.0.1"), int(os.environ.get("COLLECTOR_PORT", "8788"))
    print(f"[collector] escuchando en {host}:{port}", flush=True)
    ThreadingHTTPServer((host, port), make_handler(db, notify)).serve_forever()


if __name__ == "__main__":
    main()
