import os, sys, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import cf_historico as H

CH = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36"


def fila(n, ip, ua=CH, pais="VE"): return {"count": n, "dimensions": {"clientIP": ip, "clientCountryName": pais, "userAgent": ua}}


class T(unittest.TestCase):
    def test_se_descartan_el_vps_los_robots_y_las_rafagas_y_se_cuentan_ips_y_paises(self):
        r = H.clasificar_dia([fila(10, "187.124.175.69", "n8n"), fila(7, "2a02:4780:79:a4e1::1", "curl/8.5.0"), fila(5, "1.1.1.1", "Googlebot/2.1"),
                              fila(4, "2.2.2.2"), fila(3, "2.2.2.2"), fila(2, "3.3.3.3", pais="US"), fila(6, "9.9.9.9", ""), fila(40, "8.8.8.8", pais="DE")])
        self.assertEqual((r["cargas_bruto"], r["descartadas_vps"], r["descartadas_bots"], r["descartadas_rafaga"]), (77, 17, 11, 40))
        self.assertEqual((r["cargas"], r["ips_unicas"]), (9, 2)); self.assertEqual([tuple(x) for x in r["paises"]], [("VE", 7), ("US", 2)])

    def test_el_limite_de_rafaga_es_estricto(self):
        self.assertEqual(H.clasificar_dia([fila(10, "4.4.4.4")])["cargas"], 10); self.assertEqual(H.clasificar_dia([fila(11, "4.4.4.4")])["cargas"], 0)

    def test_el_vps_se_detecta_aunque_el_agente_parezca_un_navegador(self):
        r = H.clasificar_dia([fila(50, "187.124.175.69", CH)]); self.assertEqual((r["cargas"], r["descartadas_vps"]), (0, 50))

    def test_dia_vacio(self):
        self.assertEqual(H.clasificar_dia([]), {"cargas": 0, "ips_unicas": 0, "cargas_bruto": 0, "descartadas_vps": 0, "descartadas_bots": 0, "descartadas_rafaga": 0, "paises": []})

    def test_fusionar_actualiza_por_fecha_y_conserva_lo_antiguo(self):
        viejo = {"2026-10-20": {"cargas": 1}, "2026-11-01": {"cargas": 5}}
        out = H.fusionar(viejo, {"2026-11-01": {"cargas": 9}, "2026-11-02": {"cargas": 3}})
        self.assertEqual(list(out), ["2026-10-20", "2026-11-01", "2026-11-02"]); self.assertEqual(out["2026-11-01"]["cargas"], 9)
        self.assertEqual(viejo["2026-11-01"]["cargas"], 5)          # no muta la entrada

    def test_guardar_y_cargar_son_atomicos_y_toleran_archivo_ausente(self):
        import tempfile
        d = tempfile.mkdtemp(); p = os.path.join(d, "sub", "h.json")
        self.assertEqual(H.cargar(p), {}); H.guardar(p, {"a": 1}); self.assertEqual(H.cargar(p), {"a": 1})
        self.assertEqual(oct(os.stat(p).st_mode & 0o777), "0o644")


if __name__ == "__main__": unittest.main()
