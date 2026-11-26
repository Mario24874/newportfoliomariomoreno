#!/usr/bin/env bash
# Instala/actualiza el colector y el resumen diario en el VPS: copia el código a /opt (no depende de la rama de /root/portfolio) y reinicia.
set -euo pipefail
cd "$(dirname "$0")"
python3 -m unittest tests.test_collector tests.test_resumen
install -D -m 0644 collector.py /opt/portfolio-collector/collector.py
install -D -m 0644 resumen.py /opt/portfolio-collector/resumen.py
install -m 0644 systemd/portfolio-collector.service systemd/portfolio-resumen.service systemd/portfolio-resumen.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now portfolio-collector.service portfolio-resumen.timer
systemctl restart portfolio-collector.service
sleep 1; systemctl is-active portfolio-collector.service; systemctl list-timers portfolio-resumen.timer --no-pager | sed -n 1,2p
