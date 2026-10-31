# Demo interactiva «Las máquinas de Leonardo»

> Última actualización: 2026-10-31. Producción: https://mariomoreno.work (sección entre «AI Demos» y «Mobile Apps») → galería `/leonardo/index.html`.

## Qué es
Cinco figuras isométricas «dibujadas a mano», giratorias y con botones que funcionan, hechas con la skill **Colorfigures** (April Zhu, licencia MIT; el crédito «Made with Colorfigures» va en cada página y en la galería: **mantenerlo**). Es también la muestra de un servicio: demos interactivas de productos físicos, digitales y servicios (ver la sección «¿Para qué sirve esto?» de la galería).

| Invento | Archivo | Fuente (aprox.) | Qué se hace |
|---|---|---|---|
| Carro autopropulsado | `carro.html` | Códice Atlántico f. 812r, h. 1478–85 | elegir levas, dar cuerda, soltar el freno, ver el recorrido |
| Ornitóptero | `ornitoptero.html` | diseño, h. 1485–1505 | ritmo, aletear, probar el despegue (no despega) |
| Tornillo aéreo | `tornillo.html` | Manuscrito B f. 83v, h. 1487–89 | ritmo, girar, probar el despegue (no despega) |
| Ballesta gigante | `ballesta.html` | Códice Atlántico f. 149r, h. 1485–90 | tensión, tensar, cargar, disparar al blanco |
| Paracaídas | `paracaidas.html` | Códice Atlántico f. 381v, h. 1485 | con/sin paracaídas, carga, soltar |

Regla de contenido: **cada página dice que es una interpretación** y no afirma que el invento funcionara si no está probado (ornitóptero, tornillo y ballesta: «diseño»; paracaídas: solo el hecho verificado de la prueba de 2000, réplica de ~84 kg). Las cifras de potencia/velocidad son órdenes de magnitud estimados, y los comentarios de cabecera de cada fuente listan los supuestos.

## Dónde está cada cosa
- **Servido por el portafolio:** `/root/portfolio/public/leonardo/` (`index.html`, `manifest.json`, las 5 páginas) e imágenes de tarjeta en `public/images/leonardo-*.jpg`. Componente de la portada: `src/sections/LeonardoSection.tsx` (una tarjeta con las imágenes enmarcadas que enlaza a la galería).
- **Fuentes y herramientas:** `/root/leonardo-demo/` (no es un repo; ver su `README.md`): `*_src.html`/`carro.html` (fuente), `_helpers.js` (primitivas comunes), `assemble.py`, `dist/` (páginas construidas), `tools/` (pruebas con puppeteer-core).
- **Lista de inventos y textos de aplicaciones:** `public/leonardo/manifest.json` (la portada y la galería la leen; ES/EN). Para sumar un invento: página en `public/leonardo/`, imagen en `public/images/`, entrada en `machines` de `manifest.json`. **No hace falta tocar React.** Subir = `git push origin main` (autodeploy; Mario autorizó subir cada invento al terminarlo).

## Cómo se construye una figura nueva
1. Leer la skill (`/root/.claude/skills/colorfigures/SKILL.md`) y los ejemplos; investigar el objeto real y dejar en la cabecera del código: pasos de funcionamiento, lista de piezas y qué es interpretación.
2. Escribir `X_src.html` (con `/*HELPERS*/`), `python3 /root/leonardo-demo/assemble.py X_src.html X.html`, revisar con `tools/live.mjs`/`liveo.mjs`/`live3.mjs` (puppeteer; **no** usar `chromium --screenshot` con animaciones: se cuelga), y construir con `python3 /root/.claude/skills/colorfigures/scripts/build.py X.html dist/X.html`.
3. Capturar la imagen de tarjeta (`tools/hero4.mjs`), copiar a `public/`, actualizar `manifest.json`, subir y verificar en vivo (CSP real).

## Trampas conocidas
- **Nombres reservados del motor** (`SH`, `TURNS`, `S`, `L`, `C`, `P`, `P0`, `f`…): un choque deja la página en blanco.
- **Rendimiento:** el filtro «a mano» sobre toda la escena baja de ~33 a ~8 fps; se aplica solo al objeto, no al suelo (las losas llevan su propio temblor). Evitar `rod()` para piezas delgadas (usar `lvStick`).
- **`build.py` saca las sombras (`#41538f`) de grupos con opacidad:** para sombras suaves cambiar el color (ver las alas y el tornillo).
- **Cloudflare cachea HTML por URL:** probar con parámetro aleatorio; el manifiesto se pide con `?t=` por tramos de 10 min.
- **Escalas:** el paracaídas comprime la altura de caída (el tiempo va ×3,5); la ballesta usa 1 unidad ≈ 20 cm y no da alcance real.
- Chromium (snap) solo escribe capturas dentro de `/root`.

## Pendiente / ideas
- Video/reel para Instagram y YouTube Shorts ofreciendo el servicio (grabación de las demos con puppeteer + ffmpeg): sin empezar.
- Más inventos o demos de productos reales de clientes/Mario; quitar detalle a la ballesta si va entrecortada en móviles (hoy ~17 fps en el VPS sin GPU).
