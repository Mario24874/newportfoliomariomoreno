#!/usr/bin/env python3
"""Resumen diario del portfolio -> avisador (tema 🌐 Portfolio). SIN IA, SOLO librería estándar. Lo lanza un timer de systemd (12:05 UTC, tras el resumen del avisador).
Lee las tablas `pf_*` con la service_role y resume las últimas 24 h frente a las 24 h anteriores: visitas, únicos, tiempo medio, países, demos, clics en WhatsApp,
mensajes y reseñas. `--dry` imprime sin enviar. Secretos: /root/.secrets/supabase-tracker.env."""
import json, os, sys, urllib.parse, urllib.request
from collections import Counter
from datetime import datetime, timedelta, timezone

ENV_FILE = os.environ.get("COLLECTOR_ENV", "/root/.secrets/supabase-tracker.env")
AVISADOR_DIR = os.environ.get("AVISADOR_DIR", "/root/avisador")


def read_env(path):
    out = {}
    for line in open(path, encoding="utf-8"):
        if "=" in line and not line.lstrip().startswith("#"):
            k, v = line.split("=", 1); out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def make_fetch(url, key):
    def fetch(table, query):
        r = urllib.request.Request(f"{url.rstrip('/')}/rest/v1/{table}?{query}", headers={"apikey": key, "Authorization": f"Bearer {key}"})
        with urllib.request.urlopen(r, timeout=20) as x:
            return json.load(x)
    return fetch


def variacion(hoy, ayer):
    if ayer == 0:
        return "nuevo" if hoy else "sin cambios"
    d = round((hoy - ayer) * 100 / ayer)
    return f"{d:+d} %"


def construir(views, prev_views, demos, msgs):
    """Devuelve (titulo, lineas) a partir de las filas de las últimas 24 h (views, demos, msgs) y las visitas de las 24 h previas."""
    uniq = {v["anon_id"] for v in views}
    durs = [v["duration_seconds"] for v in views if v.get("duration_seconds")]
    medio = round(sum(durs) / len(durs)) if durs else 0
    paises = Counter(v["country"] for v in views if v.get("country")).most_common(3)
    usos = Counter(d["demo"] for d in demos if not str(d["demo"]).startswith("click:"))
    clics = sum(1 for d in demos if d["demo"] == "click:whatsapp")
    contactos = [m for m in msgs if m.get("source") != "review"]
    resenas = [m for m in msgs if m.get("source") == "review"]
    notas = []
    for m in resenas:
        t = str(m.get("message") or "")
        if t.startswith("[") and "/5]" in t:
            try: notas.append(int(t[1:t.index("/5]")]))
            except ValueError: pass
    L = [f"Visitas: {len(views)} ({variacion(len(views), len(prev_views))} vs 24 h previas) · únicos: {len(uniq)}",
         f"Tiempo medio: {medio} s" + (" · países: " + ", ".join(f"{p} {n}" for p, n in paises) if paises else "")]
    L.append("Demos IA: " + (", ".join(f"{k} {v}" for k, v in usos.most_common()) if usos else "ninguna"))
    L.append(f"Clics en WhatsApp: {clics} · mensajes de contacto: {len(contactos)} · reseñas: {len(resenas)}" + (f" (media {sum(notas)/len(notas):.1f}/5)" if notas else ""))
    return "Resumen diario (24 h)", L


def main(argv):
    env = read_env(ENV_FILE)
    f = make_fetch(env["SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"])
    ahora = datetime.now(timezone.utc)
    d1, d2 = (ahora - timedelta(hours=24)).isoformat(), (ahora - timedelta(hours=48)).isoformat()
    q = lambda col, a, b=None: urllib.parse.urlencode([("select", "*"), (col, f"gte.{a}")] + ([(col, f"lt.{b}")] if b else []) + [("limit", "20000")])  # noqa: E731
    views = f("pf_page_views", q("entered_at", d1))
    prev = f("pf_page_views", q("entered_at", d2, d1))
    demos = f("pf_demo_runs", q("created_at", d1))
    msgs = f("pf_contact_messages", q("created_at", d1))
    titulo, lineas = construir(views, prev, demos, msgs)
    print(titulo + "\n" + "\n".join(lineas))
    if "--dry" in argv:
        return
    sys.path.insert(0, AVISADOR_DIR)
    import avisador
    print(avisador.enviar_evento("Portfolio", "info", titulo, "\n".join(lineas)))


if __name__ == "__main__":
    main(sys.argv[1:])
