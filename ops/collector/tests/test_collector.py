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
    def setUp(self): self.db = FakeDb(); c._hits.clear()

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


if __name__ == "__main__": unittest.main()
