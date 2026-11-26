import os, sys, unittest
from datetime import datetime, timedelta, timezone
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import admin as a

NOW = datetime(2026, 11, 26, 16, 0, tzinfo=timezone.utc)
CH = "Mozilla/5.0 (Windows NT 10.0) Chrome/130 Safari/537.36"
MOB = "Mozilla/5.0 (iPhone; CPU iPhone OS 17) AppleWebKit Mobile Safari"


def ts(**kw): return (NOW - timedelta(**kw)).isoformat()
def V(anon, when, path="/", ref=None, ua=CH, country="VE", dur=30): return {"anon_id": anon, "entered_at": when, "path": path, "referrer": ref, "user_agent": ua, "country": country, "duration_seconds": dur}


class T(unittest.TestCase):
    def test_kpis_comparan_con_el_periodo_anterior(self):
        views = [V("a", ts(hours=2)), V("a", ts(hours=3)), V("b", ts(hours=5), dur=None),                      # periodo actual (24 h): 3 visitas, 2 únicos
                 V("a", ts(hours=30)), V("c", ts(hours=40))]                                                     # periodo previo: 2 visitas, 2 únicos
        r = a.summarize(views, [], [], "24h", NOW)
        k = r["kpis"]
        self.assertEqual((k["visits"]["v"], k["visits"]["p"], k["visits"]["d"]), (3, 2, 50.0))
        self.assertEqual((k["uniques"]["v"], k["returning"]["v"]), (2, 1))          # «a» ya venía del periodo previo
        self.assertEqual(k["short_pct"]["v"], 33.3)                                  # la visita sin duración cuenta como corta

    def test_serie_diaria_rellena_los_dias_sin_visitas_y_usa_hora_de_caracas(self):
        # 03:00 UTC del 26 = 23:00 del 25 en Caracas -> pertenece al día 25
        views = [V("a", datetime(2026, 11, 26, 3, 0, tzinfo=timezone.utc).isoformat())]
        r = a.summarize(views, [], [], "7d", NOW)
        self.assertEqual(len(r["series"]), 7)
        dias = {s["t"][:10]: s["visits"] for s in r["series"]}
        self.assertEqual(dias["2026-11-25"], 1); self.assertEqual(dias["2026-11-26"], 0)
        self.assertEqual(r["hours"][23], 1)

    def test_demos_clics_mensajes_y_embudo(self):
        views = [V("a", ts(hours=1)), V("b", ts(hours=2))]
        demos = [{"anon_id": "a", "demo": "research", "created_at": ts(hours=1)}, {"anon_id": "a", "demo": "click:whatsapp", "created_at": ts(hours=1)}]
        msgs = [{"anon_id": "a", "source": "portfolio", "status": "new", "created_at": ts(hours=1), "message": "hola"},
                {"anon_id": "b", "source": "review", "status": "new", "created_at": ts(hours=1), "message": "[5/5] x"}]
        r = a.summarize(views, demos, msgs, "24h", NOW)
        k = r["kpis"]
        self.assertEqual((k["demo_runs"]["v"], k["whatsapp"]["v"], k["contacts"]["v"], k["reviews"]["v"], k["unread"]["v"]), (1, 1, 1, 1, 1))
        self.assertEqual(r["funnel"], {"visitors": 2, "demo": 1, "contact": 1})

    def test_fuentes_dispositivos_y_paginas(self):
        views = [V("a", ts(hours=1), "/?utm_source=ig", None), V("b", ts(hours=1), "/", "https://www.google.com/search"), V("c", ts(hours=1), "/", None, MOB)]
        r = a.summarize(views, [], [], "24h", NOW)
        self.assertEqual(dict(r["sources"]), {"ig": 1, "google.com": 1, "directo": 1})
        self.assertEqual(r["devices"], {"escritorio": 2, "móvil": 1})
        self.assertEqual(r["pages"][0], ("/", 3))

    def test_sin_datos_marca_empty_y_no_falla(self):
        r = a.summarize([], [], [], "30d", NOW)
        self.assertTrue(r["empty"]); self.assertEqual(r["kpis"]["visits"]["d"], None); self.assertEqual(len(r["series"]), 30)

    def test_en_vivo_cuenta_unicos_de_los_ultimos_5_minutos(self):
        r = a.live([V("a", ts(minutes=1)), V("a", ts(minutes=2)), V("b", ts(minutes=4)), V("c", ts(minutes=20))], NOW)
        self.assertEqual(r["active_5min"], 2); self.assertEqual(len(r["last"]), 4)

    def test_mensajes_filtran_por_tipo_estado_y_texto_y_exportan_csv(self):
        rows = [{"id": "1", "name": "Ana", "email": "a@x", "phone": None, "message": "quiero una demo", "source": "portfolio", "status": "new", "created_at": ts(hours=2)},
                {"id": "2", "name": "Luis", "email": None, "phone": None, "message": "[4/5] bien", "source": "review", "status": "new", "created_at": ts(hours=1)}]
        self.assertEqual([m["id"] for m in a.messages_view(rows, kind="resena")], ["2"])
        self.assertEqual(a.messages_view(rows, kind="resena")[0]["rating"], 4)
        self.assertEqual([m["id"] for m in a.messages_view(rows, q="DEMO")], ["1"])
        self.assertEqual(a.messages_view(rows, status="read"), [])
        csv_txt = a.messages_csv(a.messages_view(rows))
        self.assertIn("quiero una demo", csv_txt); self.assertTrue(csv_txt.startswith("fecha_utc,tipo"))

    def test_fallos_de_demo_se_leen_de_las_alertas_de_visitantes(self):
        al = [{"ts": ts(hours=1), "source": "visitor", "demo": "research", "status": 500, "message": "boom"}, {"ts": ts(hours=1), "source": "monitor"},
              {"ts": ts(hours=99), "source": "visitor", "demo": "content"}]
        r = a.demos_report([{"demo": "research", "created_at": ts(hours=1), "input_preview": "hola"}, {"demo": "click:whatsapp", "created_at": ts(hours=1)}], "24h", NOW, al)
        self.assertEqual((r["total"], r["failures"]["total"], r["failures"]["by_demo"]), (1, 1, [("research", 1)]))

    def test_captacion(self):
        rows = [{"sent_at": ts(days=1), "status": "sent", "has_reply": True, "replied_at": ts(hours=3), "company": "X", "country": "US", "subject": "s"},
                {"sent_at": ts(days=2), "status": "sent", "has_reply": False, "company": "Y", "country": "ES"}]
        r = a.captacion_report(rows, NOW)
        self.assertEqual((r["sent"], r["replied"], r["reply_rate"], len(r["by_day"])), (2, 1, 50.0, 14))

    def test_campana_v2_excluye_ensayos_y_cuenta_estados_sin_inventar_respuestas(self):
        env = [{"prospecto_id": "p1", "toque": 1, "enviado_at": ts(days=1), "estado_entrega": "entregado", "rebote_tipo": None, "ensayo": False},
               {"prospecto_id": "p2", "toque": 2, "enviado_at": ts(days=2), "estado_entrega": "enviado", "rebote_tipo": "duro", "ensayo": False},
               {"prospecto_id": "p3", "toque": 1, "enviado_at": ts(days=2), "estado_entrega": "entregado", "rebote_tipo": None, "ensayo": True}]
        pro = [{"estado": "aprobado", "celda": "A", "canal": "correo"}, {"estado": "descartado", "celda": "A", "canal": None}, {"estado": "respondio", "celda": "A", "canal": "correo"}]
        evs = [{"creado": ts(hours=1), "tipo": "resend_sin_envio", "detalle": {"x": 1}}, {"creado": ts(hours=2), "tipo": "baja", "detalle": {"valor": "a@b"}}]
        r = a.campana_report(env, pro, [{"motivo": "baja"}], evs, [{"clave": "pausa", "valor": "False"}, {"clave": "fecha_inicio", "valor": "2026-11-05"}], [{"estado": "aprobado"}], NOW)
        self.assertEqual((r["sent"], r["trial_sent"], r["delivered"], r["bounced"]), (2, 1, 1, 1))
        self.assertEqual(r["prospects"]["total"], 3); self.assertEqual(r["unmatched_resend_events"], 1)
        self.assertEqual([e["type"] for e in r["recent_events"]], ["baja"])      # el ruido de Resend sin envío no se lista
        self.assertFalse(r["paused"]); self.assertEqual(len(r["by_day"]), 14)
        # respuestas: salen de los prospectos en estado «respondio»; los envíos de ensayo no cuentan como contactados
        self.assertEqual((r["contacted"], r["replied"], r["reply_rate"], r["replies_tracked"]), (2, 1, 50.0, True))

    def test_historico_filtra_por_dias_suma_totales_y_tolera_vacio(self):
        from datetime import date
        data = {"generated_at": "x", "notas": {"portfolio": "n"},
                "zona": {"2026-10-20": {"peticiones": 5, "paginas": 2, "unicos": 3}, "2026-11-25": {"peticiones": 9, "paginas": 4, "unicos": 6}},
                "portfolio": {"2026-11-24": {"cargas": 10, "ips_unicas": 4, "cargas_bruto": 50, "descartadas_vps": 20, "descartadas_bots": 10, "descartadas_rafaga": 10, "paises": [["US", 7], ["VE", 3]]},
                              "2026-11-25": {"cargas": 20, "ips_unicas": 6, "cargas_bruto": 60, "descartadas_vps": 20, "descartadas_bots": 10, "descartadas_rafaga": 10, "paises": [["US", 15], ["DE", 5]]}}}
        r = a.historico_report(data, 7, date(2026, 11, 26))
        self.assertEqual([z["date"] for z in r["zona"]], ["2026-11-25"])                      # 20-oct queda fuera de 7 días
        self.assertEqual((r["totales"]["cargas"], r["totales"]["cargas_bruto"], r["totales"]["ips_por_dia"], r["totales"]["dias"]), (30, 110, 5, 2))
        self.assertEqual(r["paises"][0], ("US", 22)); self.assertFalse(r["empty"])
        self.assertTrue(a.historico_report({}, 30, date(2026, 11, 26))["empty"])

    def test_avisos_solo_del_portfolio(self):
        r = a.avisos_report([{"t": 1.0, "proyecto": "Tienda", "tipo": "info", "titulo": "x", "estado": "enviado"}, {"t": 2.0, "proyecto": "Portfolio", "tipo": "info", "titulo": "y", "estado": "enviado"}])
        self.assertEqual([e["title"] for e in r["recent"]], ["y"]); self.assertGreater(len(r["rules"]), 5)


if __name__ == "__main__": unittest.main()
