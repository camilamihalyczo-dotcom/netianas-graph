# N(H)ACER MUJER EN INTERNET · grafo

Obra de net.art basada en *Netianas* (2005) de Remedios Zafra: una red rizomática navegable, con estética de JODI y VNS Matrix. Hecha con **p5.js**, física propia y sonido generado con Web Audio.

Sin centro, sin origen, sin orden correcto de lectura. Se entra como a internet en los 90: una pantalla negra con un cursor `_`; al tocar suena un módem y la red nace con su sonido. Flotan las 14 netianas, la netiana que falta `[+]` y palabras sueltas del texto. La red crece a medida que se navega.

## Cómo se navega

- **Tocar una netiana** `[A]` → aparecen sus conceptos `#`, sus referentes `0/1` y frases de su texto, y se abre su panel.
- **Tocar un referente** → aparecen sus categorías `()` y las otras netianas que encarna.
- **Tocar una categoría o una teoría** (`#Haraway`, `#Butler`…) → sus elementos se juntan y se trazan como un circuito: los grupos surgen navegando, no hay menú.
- **Tocar una palabra** → abre su netiana. Las palabras están unidas entre sí por hilos punteados.
- **`[+]` tu netiana** → abre el formulario de sugerencias en el panel, sin salir de la obra.
- El **cursor `_`** al lado de un nodo indica que tiene conexiones por descubrir.
- **Arrastrar un nodo** lo deja fijo donde se suelta (doble clic lo libera). Arrastrar el fondo mueve la vista; rueda o pellizco, zoom. `Esc` cierra el panel.
- Cuando nadie toca la red, un **latido** con forma de electrocardiograma la recorre y termina en una netiana que pide ser tocada.
- **Sonido:** arranca con el toque que conecta y no se silencia (los navegadores no permiten sonido antes de un toque: por eso la obra empieza dormida).

## Archivos

| archivo | qué tiene |
|---|---|
| `index.html` | estructura: HUD, lienzo y panel |
| `style.css` | estética (verde JODI, magenta VNS Matrix, scanlines) |
| `sketch.js` | el grafo en p5.js: física, dibujo, navegación y panel |
| `data.js` | las 14 netianas (`DATA`) y los referentes (`REFS`), extraídos de `index.html` del sitio original |
| `sonido.js` | **editable:** el sonido de la obra, generado con Web Audio (sin archivos): zumbido de fondo, bips al tocar, datos, latido, glitch, tecleo y módem. Arranca con el primer clic |
| `grupos.js` | **editable:** cómo se arman las agrupaciones (qué tag va a qué región, qué conceptos van con cada teoría, colores) |

Las imágenes se cargan desde `https://netianas.vercel.app/img/`, así no se duplican.

## Para agregar una netiana o un referente

Editá `data.js` con el mismo formato que el sitio original. El grafo arma solo los nodos y las conexiones.

## Publicar

Es un sitio estático, sin build: está en el repo `netianas-graph` y publicado en https://netianas-graph.vercel.app

Para probarlo local hace falta un servidor (por ejemplo `npx serve .`) o la extensión Live Server de VS Code.
