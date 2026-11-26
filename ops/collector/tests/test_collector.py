import os, sys, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import collector as c

BROWSER = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36"
ANON = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
VID = "11111111-2222-3333-4444-555555555555"


class FakeDb:
    def __init__(self): self.rows = []; self.upd = []
    def insert(self, t, row, returning=False):
        self.rows.append((t, row)); return [{"id": VID}] if returning else None
    def update(self, t, f, row): self.upd.append((t, f, row))


class T(unittest.TestCase):
    def setUp(self):
        self.db = FakeDb(); c._hits.clear(); c._uniq.clear(); c._clicks.clear(); c._last["spike"] = None
        self.ev = []; self.emit = lambda *a: self.ev.append(a)

    def test_visita_real_se_guarda_con_pais_y_devuelve_id(self):
        code, body = c.handle("pv", {"anon_id": ANON, "path": "/", "referrer": "https://google.com"}, BROWSER, "VE", self.db)
        self.assertEqual((code, body["id"]), (200, VID))
        t, row = self.db.rows[0]
        self.assertEqual((t, row["country"], row["area"]), ("pf_page_views", "VE", "portfolio"))
        self.assertNotIn("ip", row)

    def test_bots_y_clientes_sin_ua_no_se_guardan(self):
        for ua in ("Googlebot/2.1", "curl/8.0", "python-requests/2.3", "", None, "HeadlessChrome/120"):
            self.assertEqual(c.handle("pv", {"anon_id": ANON}, ua, "US", self.db)[0], 204)
        self.assertEqual(self.db.rows, [])

    def test_validacion_rechaza_entradas_malas(self):
        self.assertEqual(c.handle("pv", {"anon_id": "x"}, BROWSER, None, self.db)[0], 400)
        self.assertEqual(c.handle("pv", {"anon_id": ANON, "area": "otro"}, BROWSER, None, self.db)[0], 400)
        self.assertEqual(c.handle("dur", {"id": "no-uuid", "anon_id": ANON, "seconds": 5}, BROWSER, None, self.db)[0], 400)
        self.assertEqual(c.handle("dur", {"id": VID, "anon_id": ANON, "seconds": 999999}, BROWSER, None, self.db)[0], 400)
        self.assertEqual(c.handle("dur", {"id": VID, "anon_id": ANON, "seconds": True}, BROWSER, None, self.db)[0], 400)
        self.assertEqual(c.handle("contact", {"message": "   "}, BROWSER, None, self.db)[0], 400)
        self.assertEqual(self.db.rows, [])

    def test_pais_invalido_se_ignora(self):
        c.handle("pv", {"anon_id": ANON}, BROWSER, "XX1; drop", self.db)
        self.assertIsNone(self.db.rows[0][1]["country"])

    def test_duracion_actualiza_solo_la_fila_del_mismo_visitante(self):
        self.assertEqual(c.handle("dur", {"id": VID, "anon_id": ANON, "seconds": 42.7}, BROWSER, None, self.db)[0], 204)
        t, f, row = self.db.upd[0]
        self.assertEqual((f["id"], f["anon_id"], row["duration_seconds"]), (f"eq.{VID}", f"eq.{ANON}", 42))

    def test_demo_y_contacto_se_guardan_recortados(self):
        c.handle("demo", {"anon_id": ANON, "demo": "whatsapp-agent", "input_preview": "x" * 500}, BROWSER, None, self.db)
        c.handle("contact", {"name": "Ana", "email": "a@b.co", "message": "hola " * 2000, "anon_id": ANON}, BROWSER, None, self.db)
        self.assertEqual(len(self.db.rows[0][1]["input_preview"]), 280)
        self.assertEqual(len(self.db.rows[1][1]["message"]), 4000)

    def test_limite_por_ip(self):
        res = [c.rate_ok("contact", "h", 1000.0 + i) for i in range(7)]
        self.assertEqual(res, [True] * 5 + [False] * 2)
        self.assertTrue(c.rate_ok("contact", "h", 1000.0 + 3700))

    def test_fallo_de_supabase_se_propaga_para_responder_502(self):
        class Boom(FakeDb):
            def insert(self, *a, **k): raise OSError("supabase caído")
        with self.assertRaises(OSError): c.handle("pv", {"anon_id": ANON}, BROWSER, None, Boom())

    def test_contacto_avisa_con_nombre_y_mensaje_pero_sin_correo_ni_telefono(self):
        c.handle("contact", {"name": "Ana", "email": "ana@x.com", "phone": "+58412", "message": "Quiero una demo", "anon_id": ANON}, BROWSER, None, self.db, self.emit)
        tipo, titulo, det = self.ev[0]
        self.assertEqual((tipo, titulo), ("mensaje", "Mensaje de contacto"))
        self.assertIn("Ana", det); self.assertIn("Quiero una demo", det)
        self.assertNotIn("ana@x.com", det); self.assertNotIn("+58412", det)

    def test_resena_valida_se_guarda_como_review_y_avisa(self):
        self.assertEqual(c.handle("review", {"rating": 4, "comment": "Muy bueno", "reviewer_name": "Luis", "anon_id": ANON}, BROWSER, None, self.db, self.emit)[0], 204)
        t, row = self.db.rows[0]
        self.assertEqual((t, row["source"], row["message"], row["name"]), ("pf_contact_messages", "review", "[4/5] Muy bueno", "Luis"))
        self.assertEqual(self.ev[0][1], "Reseña 4/5")

    def test_resena_con_puntuacion_invalida_se_rechaza(self):
        for r in (0, 6, "5", True, None, 3.5):
            self.assertEqual(c.handle("review", {"rating": r}, BROWSER, None, self.db, self.emit)[0], 400)
        self.assertEqual((self.db.rows, self.ev), ([], []))

    def test_clic_whatsapp_se_guarda_siempre_y_avisa_una_vez_por_hora(self):
        for i in range(3): c.handle("click", {"target": "whatsapp", "anon_id": ANON}, BROWSER, "VE", self.db, self.emit, now=1000.0 + i)
        self.assertEqual(len(self.db.rows), 3); self.assertEqual(len(self.ev), 1)
        c.handle("click", {"target": "whatsapp", "anon_id": ANON}, BROWSER, "VE", self.db, self.emit, now=1000.0 + 3700)
        self.assertEqual(len(self.ev), 2)
        self.assertEqual(self.db.rows[0][1]["demo"], "click:whatsapp")

    def test_clic_de_destino_desconocido_o_bot_no_cuenta(self):
        self.assertEqual(c.handle("click", {"target": "otro"}, BROWSER, None, self.db, self.emit)[0], 400)
        self.assertEqual(c.handle("click", {"target": "whatsapp"}, "Googlebot", None, self.db, self.emit)[0], 204)
        self.assertEqual((self.db.rows, self.ev), ([], []))

    def test_pico_de_trafico_avisa_al_cruzar_el_umbral_y_no_se_repite(self):
        old = c.SPIKE_N; c.SPIKE_N = 3
        try:
            for i in range(5): c.handle("pv", {"anon_id": f"visitante-{i}"}, BROWSER, None, self.db, self.emit, now=1000.0 + i)
            picos = [e for e in self.ev if e[1] == "Pico de tráfico"]
            self.assertEqual(len(picos), 1); self.assertIn("3 visitantes", picos[0][2])
        finally: c.SPIKE_N = old

    def test_un_aviso_que_falla_no_rompe_el_guardado(self):
        def boom(*a): raise RuntimeError("telegram caído")
        self.assertEqual(c.handle("contact", {"message": "hola"}, BROWSER, None, self.db, boom)[0], 204)
        self.assertEqual(len(self.db.rows), 1)


class Http(unittest.TestCase):
    """Capa HTTP real (servidor en un puerto efímero) con BD y avisador simulados: es lo que ejecuta el navegador."""
    def setUp(self):
        import json, threading, urllib.request, http.server, time
        c._hits.clear(); c._uniq.clear(); c._clicks.clear(); c._last["spike"] = None
        self.db = FakeDb(); self.avisos = []
        self.srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), c.make_handler(self.db, lambda tipo, titulo, detalle=None: self.avisos.append((tipo, titulo, detalle))))
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()
        self.port = self.srv.server_address[1]
        self.json, self.urlreq, self.time = json, urllib.request, time

    def tearDown(self): self.srv.shutdown(); self.srv.server_close()

    def post(self, path, body, origin="https://mariomoreno.work"):
        import urllib.error
        r = self.urlreq.Request(f"http://127.0.0.1:{self.port}{path}", data=self.json.dumps(body).encode(), method="POST",
                                headers={"Origin": origin, "User-Agent": BROWSER, "Content-Type": "text/plain"})
        try:
            with self.urlreq.urlopen(r, timeout=5) as x: return x.status
        except urllib.error.HTTPError as e: return e.code

    def esperar(self, n):
        for _ in range(50):
            if len(self.avisos) >= n: break
            self.time.sleep(0.02)

    def test_contacto_por_http_guarda_y_avisa_con_tres_argumentos(self):
        self.assertEqual(self.post("/t/contact", {"name": "Ana", "message": "hola", "anon_id": ANON}), 204)
        self.esperar(1)
        self.assertEqual(self.avisos[0][:2], ("mensaje", "Mensaje de contacto")); self.assertEqual(len(self.db.rows), 1)

    def test_origen_ajeno_se_rechaza_y_no_guarda(self):
        self.assertEqual(self.post("/t/contact", {"message": "x"}, origin="https://evil.example"), 403); self.assertEqual(self.db.rows, [])

    def test_fallo_de_supabase_responde_502_y_avisa_error(self):
        class Boom(FakeDb):
            def insert(self, *a, **k): raise OSError("supabase caído")
        self.srv.RequestHandlerClass.db = Boom()
        self.assertEqual(self.post("/t/pv", {"anon_id": ANON}), 502)
        self.esperar(1) if False else self.time.sleep(0.1)
        self.assertEqual(self.avisos[0][:2], ("error", "El colector no puede guardar en Supabase"))


class AdminHttp(unittest.TestCase):
    """/admin/* por HTTP real: Supabase Auth simulado (token «dueno» = owner, «otro» = otra persona, cualquier otro = inválido)."""
    def setUp(self):
        import json, threading, http.server, urllib.request
        self.json, self.urlreq = json, urllib.request
        c.admin._cache.clear()

        class AuthStub(http.server.BaseHTTPRequestHandler):
            def do_GET(h):
                tok = (h.headers.get("Authorization") or "")[7:]
                email = {"dueno": "Dueno@Ejemplo.com", "otro": "intruso@ejemplo.com"}.get(tok)
                h.send_response(200 if email else 401); h.send_header("Content-Type", "application/json"); h.end_headers()
                h.wfile.write(json.dumps({"email": email} if email else {"msg": "invalid"}).encode())
            def log_message(h, *a): pass
        self.auth_srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), AuthStub)
        threading.Thread(target=self.auth_srv.serve_forever, daemon=True).start()

        class AdminDb(FakeDb):
            def select_all(s, table, query): return {"pf_page_views": [], "pf_demo_runs": [], "pf_contact_messages": [{"id": "1", "name": "Ana", "message": "hola", "source": "portfolio", "status": "new",
                                                    "created_at": "2026-11-26T10:00:00+00:00", "anon_id": ANON}]}.get(table, [])
        self.db = AdminDb()
        auth = c.Auth(f"http://127.0.0.1:{self.auth_srv.server_address[1]}", "k", ["dueno@ejemplo.com"])
        self.srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), c.make_handler(self.db, None, auth))
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()
        self.port = self.srv.server_address[1]

    def tearDown(self):
        self.srv.shutdown(); self.srv.server_close(); self.auth_srv.shutdown(); self.auth_srv.server_close()

    def call(self, method, path, token=None, origin="https://mariomoreno.work", body=None):
        import urllib.error
        h = {"Origin": origin}
        if token: h["Authorization"] = "Bearer " + token
        r = self.urlreq.Request(f"http://127.0.0.1:{self.port}{path}", data=self.json.dumps(body).encode() if body is not None else None, method=method, headers=h)
        try:
            with self.urlreq.urlopen(r, timeout=5) as x: return x.status, x.read().decode(), dict(x.headers)
        except urllib.error.HTTPError as e: return e.code, e.read().decode(), dict(e.headers)

    def test_sin_token_401_otra_persona_403_owner_200(self):
        self.assertEqual(self.call("GET", "/admin/live")[0], 401)
        self.assertEqual(self.call("GET", "/admin/live", "falso")[0], 401)
        self.assertEqual(self.call("GET", "/admin/live", "otro")[0], 403)
        code, body, _ = self.call("GET", "/admin/live", "dueno")
        self.assertEqual(code, 200); self.assertEqual(self.json.loads(body)["active_5min"], 0)

    def test_origen_ajeno_se_rechaza_aun_con_token_valido(self):
        self.assertEqual(self.call("GET", "/admin/live", "dueno", origin="https://evil.example")[0], 403)

    def test_resumen_y_rango_invalido(self):
        code, body, _ = self.call("GET", "/admin/summary?range=7d", "dueno")
        self.assertEqual(code, 200); self.assertTrue(self.json.loads(body)["empty"])
        self.assertEqual(self.call("GET", "/admin/summary?range=1y", "dueno")[0], 400)

    def test_bandeja_csv_y_cambio_de_estado(self):
        code, body, hdr = self.call("GET", "/admin/messages.csv", "dueno")
        self.assertEqual(code, 200); self.assertIn("text/csv", hdr.get("Content-Type", "")); self.assertIn("hola", body)
        mid = "11111111-2222-3333-4444-555555555555"
        self.assertEqual(self.call("PATCH", f"/admin/messages/{mid}", "dueno", body={"status": "read"})[0], 200)
        self.assertEqual(self.db.upd[-1], ("pf_contact_messages", {"id": f"eq.{mid}"}, {"status": "read"}))
        self.assertEqual(self.call("PATCH", f"/admin/messages/{mid}", "dueno", body={"status": "borrado"})[0], 400)
        self.assertEqual(self.call("PATCH", f"/admin/messages/{mid}", "otro", body={"status": "read"})[0], 403)

    def test_preflight_permite_authorization_solo_desde_el_sitio(self):
        import urllib.error
        r = self.urlreq.Request(f"http://127.0.0.1:{self.port}/admin/summary", method="OPTIONS", headers={"Origin": "https://mariomoreno.work"})
        with self.urlreq.urlopen(r, timeout=5) as x:
            self.assertIn("Authorization", x.headers["Access-Control-Allow-Headers"]); self.assertIn("PATCH", x.headers["Access-Control-Allow-Methods"])


if __name__ == "__main__": unittest.main()
