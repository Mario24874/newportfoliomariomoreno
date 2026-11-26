import os, sys, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import resumen as r


class T(unittest.TestCase):
    def test_resumen_con_actividad(self):
        views = [{"anon_id": "a", "country": "VE", "duration_seconds": 30}, {"anon_id": "a", "country": "VE", "duration_seconds": None},
                 {"anon_id": "b", "country": "US", "duration_seconds": 90}]
        demos = [{"demo": "research"}, {"demo": "research"}, {"demo": "click:whatsapp"}]
        msgs = [{"source": "portfolio", "message": "hola"}, {"source": "review", "message": "[5/5] genial"}, {"source": "review", "message": "[3/5] ok"}]
        t, L = r.construir(views, [1, 2], demos, msgs)
        txt = "\n".join(L)
        self.assertIn("Visitas: 3 (+50 % vs 24 h previas) · únicos: 2", txt)
        self.assertIn("Tiempo medio: 60 s", txt); self.assertIn("VE 2", txt)
        self.assertIn("research 2", txt); self.assertNotIn("click:", txt)
        self.assertIn("Clics en WhatsApp: 1 · mensajes de contacto: 1 · reseñas: 2 (media 4.0/5)", txt)

    def test_resumen_sin_datos_no_falla(self):
        t, L = r.construir([], [], [], [])
        self.assertIn("Visitas: 0 (sin cambios", "\n".join(L)); self.assertIn("Demos IA: ninguna", "\n".join(L))

    def test_variacion(self):
        self.assertEqual((r.variacion(5, 0), r.variacion(0, 0), r.variacion(2, 4)), ("nuevo", "sin cambios", "-50 %"))


if __name__ == "__main__": unittest.main()
