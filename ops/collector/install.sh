#!/usr/bin/env bash
# Instala/actualiza el colector en el VPS: copia el código a /opt (así no depende de la rama de /root/portfolio) y reinicia el servicio.
set -euo pipefail
cd "$(dirname "$0")"
python3 -m unittest tests.test_collector
install -D -m 0644 collector.py /opt/portfolio-collector/collector.py
install -m 0644 systemd/portfolio-collector.service /etc/systemd/system/portfolio-collector.service
systemctl daemon-reload && systemctl enable --now portfolio-collector.service && systemctl restart portfolio-collector.service
sleep 1; systemctl is-active portfolio-collector.service
