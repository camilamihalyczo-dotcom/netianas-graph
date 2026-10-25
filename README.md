# N(H)ACER MUJER EN INTERNET · grafo

Versión rizomática de [netianas.vercel.app](https://netianas.vercel.app) navegada como un grafo, inspirada en la vista de grafo de Obsidian. Hecha con **p5.js** y física propia.

Sin centro, sin origen, sin orden correcto de lectura: el grafo arranca con las 14 netianas flotando y crece a medida que navegás.

## Cómo se navega

- **Tocar una netiana** → aparecen sus conceptos (magenta) y sus referentes (cian), y se abre su texto en el panel.
- **Tocar un referente** → aparecen sus categorías (rombos: región, tipo, medio…) y las otras netianas que encarna.
- **Tocar una categoría** → aparecen todos los referentes que la comparten.
- El **anillo punteado** alrededor de un nodo indica que todavía tiene conexiones por descubrir.
- **Agrupar** por región, tipo, medio o teoría: los nodos de cada grupo se juntan en un cúmulo de color. Un nodo puede estar en varios grupos a la vez: las categorías se superponen, no se excluyen.
- Arrastrar el fondo para moverse, rueda o pellizco para hacer zoom, arrastrar nodos para reacomodarlos. `Esc` cierra el panel.

## Archivos

| archivo | qué tiene |
|---|---|
| `index.html` | estructura: HUD, lienzo y panel |
| `style.css` | estética (verde JODI, magenta VNS Matrix, scanlines) |
| `sketch.js` | el grafo en p5.js: física, dibujo, navegación y panel |
| `data.js` | las 14 netianas (`DATA`) y los referentes (`REFS`), extraídos de `index.html` del sitio original |
| `grupos.js` | **editable:** cómo se arman las agrupaciones (qué tag va a qué región, qué conceptos van con cada teoría, colores) |

Las imágenes se cargan desde `https://netianas.vercel.app/img/`, así no se duplican.

## Para agregar una netiana o un referente

Editá `data.js` con el mismo formato que el sitio original. El grafo arma solo los nodos y las conexiones.

## Publicar

Es un sitio estático: se sube la carpeta a un repo nuevo y se importa en Vercel, sin build.

Para probarlo local hace falta un servidor (por ejemplo `npx serve .`) o la extensión Live Server de VS Code.
