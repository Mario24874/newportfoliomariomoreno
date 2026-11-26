#!/usr/bin/env python3
"""Historial de tráfico del portfolio desde Cloudflare -> /var/lib/portfolio-collector/cf-historico.json. SIN IA, SOLO librería estándar.
Por qué existe: el sitio no guardaba visitas antes del 26-nov (bug de RLS) y Cloudflare, que está delante, sí vio el tráfico. Además Cloudflare solo conserva
~38 días (zona) y ~30 días (por host): este archivo acumula día a día para que el historial no se pierda cuando Cloudflare lo borre.
Dos series (fechas en UTC):
  zona      : peticiones, páginas vistas e «únicos» de TODA la zona mariomoreno.work (incluye tienda, menú, remember… y bots). Exacto de Cloudflare.
  portfolio : solo el host mariomoreno.work, cargas de página HTML (200), SIN el propio VPS (monitores, pruebas), agentes de robots conocidos ni IPs con ráfagas (>10 cargas/día); e IPs distintas.
              ES UNA ESTIMACIÓN: quedan robots de centros de datos con apariencia de navegador; los números son una cota superior de visitas humanas.
Uso: cf_historico.py [--dias N]   (N=30 por defecto en la primera carga; el timer diario usa 3 para corregir los datos tardíos).
Token: /root/.secrets/cloudflare.token (permisos Zone·Analytics·Read). Salida atómica, permisos 644."""
import json, os, re, sys, tempfile, urllib.request
from collections import Counter
from datetime import date, datetime, timedelta, timezone

TOKEN_FILE = os.environ.get("CF_TOKEN_FILE", "/root/.secrets/cloudflare.token")
SALIDA = os.environ.get("CF_HISTORICO", "/var/lib/portfolio-collector/cf-historico.json")
ZONA, HOST = "mariomoreno.work", "mariomoreno.work"
RAFAGA = 10                                          # una IP con más de 10 cargas HTML en un día se trata como script, no como persona
IPS_PROPIAS = {"187.124.175.69"}                      # IPv4 pública del VPS (monitores, pruebas, n8n)
PREFIJOS_PROPIOS = ("2a02:4780:79:a4e1:",)            # IPv6 del VPS
BOT_RE = re.compile(r"bot|crawl|spider|slurp|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|httpclient|go-http|java/|axios|node|n8n|okhttp|preview|scrapy|libwww|facebookexternalhit|whatsapp|^$", re.I)
API = "https://api.cloudflare.com/client/v4"


def es_propia(ip):
    return ip in IPS_PROPIAS or any(ip.startswith(p) for p in PREFIJOS_PROPIOS)


def clasificar_dia(filas):
    """filas: [{count, dimensions:{clientIP, clientCountryName, userAgent}}] de HTML 200 de un día. Devuelve el resumen del portfolio de ese día.
    Orden de descarte: VPS propio → agente de robot → IP con ráfaga (> RAFAGA cargas en el día). Lo que queda es una COTA SUPERIOR de visitas humanas."""
    total = propias = bots = 0
    por_ip, pais_de = Counter(), {}
    for f in filas:
        n, d = int(f.get("count") or 0), f.get("dimensions") or {}
        ip, ua = d.get("clientIP") or "", d.get("userAgent") or ""
        total += n
        if es_propia(ip):
            propias += n
        elif BOT_RE.search(ua):
            bots += n
        else:
            por_ip[ip] += n; pais_de[ip] = d.get("clientCountryName") or "??"
    rafaga = sum(n for n in por_ip.values() if n > RAFAGA)
    humanas = {ip: n for ip, n in por_ip.items() if n <= RAFAGA}
    paises = Counter()
    for ip, n in humanas.items():
        paises[pais_de[ip]] += n
    return {"cargas": sum(humanas.values()), "ips_unicas": len(humanas), "cargas_bruto": total, "descartadas_vps": propias, "descartadas_bots": bots,
            "descartadas_rafaga": rafaga, "paises": paises.most_common(8)}


def fusionar(existente, nuevos):
    """Actualiza por fecha sin borrar días antiguos que Cloudflare ya no devuelve."""
    out = {k: dict(v) for k, v in (existente or {}).items()}
    for dia, v in nuevos.items():
        out[dia] = v
    return dict(sorted(out.items()))


def _gql(token, query):
    r = urllib.request.Request(f"{API}/graphql", data=json.dumps({"query": query}).encode(), headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    with urllib.request.urlopen(r, timeout=60) as x:
        d = json.load(x)
    if d.get("errors"):
        raise RuntimeError(f"Cloudflare GraphQL: {d['errors'][0].get('message', '')[:200]}")
    return d["data"]["viewer"]["zones"][0]


def zona_id(token):
    r = urllib.request.Request(f"{API}/zones?name={ZONA}", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(r, timeout=30) as x:
        return json.load(x)["result"][0]["id"]


def descargar_zona(token, zid, dias=360):
    desde = (date.today() - timedelta(days=dias)).isoformat()
    z = _gql(token, '{viewer{zones(filter:{zoneTag:"%s"}){httpRequests1dGroups(limit:400,filter:{date_gt:"%s"},orderBy:[date_ASC]){dimensions{date} sum{requests pageViews} uniq{uniques}}}}}' % (zid, desde))
    return {g["dimensions"]["date"]: {"peticiones": g["sum"]["requests"], "paginas": g["sum"]["pageViews"], "unicos": g["uniq"]["uniques"]} for g in z["httpRequests1dGroups"]}


def descargar_portfolio_dia(token, zid, dia):
    ini = datetime.fromisoformat(dia).replace(tzinfo=timezone.utc)
    a, b = ini.strftime("%Y-%m-%dT%H:%M:%SZ"), (ini + timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
    z = _gql(token, '{viewer{zones(filter:{zoneTag:"%s"}){httpRequestsAdaptiveGroups(limit:10000,filter:{datetime_geq:"%s",datetime_lt:"%s",clientRequestHTTPHost:"%s",edgeResponseContentTypeName:"html",edgeResponseStatus:200},orderBy:[count_DESC]){count dimensions{clientIP clientCountryName userAgent}}}}}' % (zid, a, b, HOST))
    return clasificar_dia(z["httpRequestsAdaptiveGroups"])


def cargar(path):
    try:
        return json.load(open(path, encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def guardar(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(path), suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    os.chmod(tmp, 0o644); os.replace(tmp, path)


def main(argv):
    dias = int(argv[argv.index("--dias") + 1]) if "--dias" in argv else 30
    token = open(TOKEN_FILE, encoding="utf-8").read().strip()
    zid = zona_id(token)
    previo = cargar(SALIDA)
    zona = fusionar(previo.get("zona"), descargar_zona(token, zid))
    nuevos = {}
    for i in range(1, dias + 1):                                    # de ayer hacia atrás; hoy está incompleto y se omite
        dia = (date.today() - timedelta(days=i)).isoformat()
        nuevos[dia] = descargar_portfolio_dia(token, zid, dia)
    port = fusionar(previo.get("portfolio"), nuevos)
    guardar(SALIDA, {"generated_at": datetime.now(timezone.utc).isoformat(), "zona": zona, "portfolio": port,
                     "notas": {"zona": "Toda la zona mariomoreno.work (incluye subdominios y robots). Fuente: Cloudflare, exacto.",
                               "portfolio": "Host mariomoreno.work, HTML 200, sin el VPS, sin agentes de robots y sin IPs con ráfagas (>10 cargas/día). Estimación (cota superior): quedan robots de centros de datos con 1-10 cargas."}})
    print(f"historial: zona {len(zona)} días, portfolio {len(port)} días -> {SALIDA}")


if __name__ == "__main__":
    main(sys.argv[1:])
