/* ══════════════════════════════════════
   N(H)ACER MUJER EN INTERNET · grafo rizomático
   p5.js + física propia. Sin centro, sin origen,
   sin un orden correcto de lectura.
   Estética: JODI y VNS Matrix. Densidad de red: StarryNight (Rhizome, 1999).
══════════════════════════════════════ */

const IMG_BASE = 'https://netianas.vercel.app/img/';
const FORM_URL = 'https://netianas.vercel.app/form_sugerencias.html';

const COL = {
  bg: '#050505', green: '#00ff41', gd: '#00aa2a', gf: '#001a00',
  mag: '#ff00ff', magd: '#880088', cyan: '#00ffff', white: '#e0ffe0'
};

const TIPOS = {
  netiana:   { color: COL.green, nombre: 'netiana' },
  proponer:  { color: COL.mag,   nombre: 'tu netiana' },
  palabra:   { color: COL.white, nombre: '' },
  concepto:  { color: COL.mag,   nombre: 'concepto' },
  referente: { color: COL.cyan,  nombre: 'referente' },
  categoria: { color: COL.white, nombre: 'categoría' }
};

/* ── CONSTRUIR EL GRAFO ───────────────────────── */
const NODES = [];
const EDGES = [];
const byId = {};
const edgeKeys = new Set();

function addNode(id, type, props) {
  if (byId[id]) return byId[id];
  const n = Object.assign({
    id, type, x: 0, y: 0, vx: 0, vy: 0,
    visible: false, born: -999, nbr: new Set(),
    seed: Math.random() * 1000, visitas: 0
  }, props);
  NODES.push(n);
  byId[id] = n;
  return n;
}
function link(a, b) {
  const k = a.id < b.id ? a.id + '|' + b.id : b.id + '|' + a.id;
  if (edgeKeys.has(k)) return;
  edgeKeys.add(k);
  const e = { a, b, seed: Math.random() * 1000 };
  EDGES.push(e);
  edgeMap[k] = e;
  a.nbr.add(b); b.nbr.add(a);
}
const edgeMap = {};
const LATERALES = [];
const claveDe = (a, b) => a.id < b.id ? a.id + '|' + b.id : b.id + '|' + a.id;
// conexión lateral: no es jerárquica ni sirve para descubrir, solo une lo que se parece
function lateral(a, b) {
  const k = claveDe(a, b);
  if (edgeMap[k]) return edgeMap[k].lateral ? edgeMap[k] : null;
  const e = { a, b, seed: Math.random() * 1000, lateral: true };
  LATERALES.push(e);
  edgeMap[k] = e;
  return e;
}
const tagOf = s => { const m = s.match(/^\((.+)\)$/); return m ? m[1] : null; };

DATA.forEach((d, i) => {
  const n = addNode('n:' + i, 'netiana', {
    idx: i, letra: d.l.replace(/[()]/g, ''), label: d.a, data: d
  });
  d.t.forEach(t => link(n, addNode('t:' + t, 'concepto', { label: t })));
});

Object.entries(REFS).forEach(([ni, refs]) => {
  refs.forEach(r => {
    if (!r) return;
    const rn = addNode('r:' + r.title, 'referente', { label: r.title, ref: r, tags: new Set() });
    link(byId['n:' + ni], rn);
    r.sub.forEach(s => {
      const t = tagOf(s);
      if (t) { rn.tags.add(t); link(rn, addNode('c:' + t, 'categoria', { label: t })); }
      else if (/^\d/.test(s)) rn.anio = rn.anio || s;
      else rn.pais = rn.pais || s;
    });
  });
});

// [+] la netiana que falta: quien navega puede proponer una nueva
const PROPONER = addNode('p:+', 'proponer', { letra: '+', label: 'tu netiana' });
const grande = n => n.type === 'netiana' || n.type === 'proponer';

/* ── PALABRAS SUELTAS: fragmentos del texto flotan en el rizoma ──
   La categoría de Zafra de cada netiana está a la vista desde el inicio;
   las frases cortas de su texto aparecen al tocarla. */
const limpiar = h => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
NODES.filter(n => n.type === 'netiana').forEach(n => {
  const cat = addNode('w:' + n.idx + ':cat', 'palabra', { label: n.data.n.replace(/[«»]/g, ''), net: n, inicial: true });
  link(n, cat);
  const frases = (limpiar(n.data.d) + ' ' + limpiar(n.data.b))
    .split(/(?<=[.?!])\s+/)
    .map(f => f.trim().replace(/\.$/, ''))
    .filter(f => f.length >= 10 && f.length <= 46);
  // sin repetidas: se descarta una frase si empieza igual que otra ya elegida
  const elegidas = [];
  frases.forEach(f => { if (!elegidas.some(e => e.slice(0, 18) === f.slice(0, 18))) elegidas.push(f); });
  elegidas.slice(0, 3).forEach((f, j) => link(n, addNode('w:' + n.idx + ':' + j, 'palabra', { label: f, net: n })));
});
// la pregunta del libro, suelta, sin netiana
['¿qué es una mujer en internet?', 'depende'].forEach((f, j) =>
  addNode('w:libre:' + j, 'palabra', { label: f, inicial: true }));

// las palabras también se enlazan entre sí: por las palabras que comparten
// y, si no comparten ninguna, con otra al azar. El texto es otra capa del rizoma.
(function tejerPalabras() {
  const vacias = new Set(['como', 'para', 'pero', 'desde', 'entre', 'sobre', 'sino', 'cuando', 'donde', 'esta', 'este', 'todo', 'toda', 'cada', 'puede', 'sola', 'solo', 'nunca', 'siempre', 'otra', 'otras', 'otro', 'ellas', 'mismo', 'misma']);
  const ps = NODES.filter(n => n.type === 'palabra');
  const clave = f => new Set(f.toLowerCase().replace(/[¿?¡!:;,.«»]/g, '').split(' ').filter(w => w.length > 4 && !vacias.has(w)));
  ps.forEach(n => n.claves = clave(n.label));
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
    if (ps[i].net && ps[i].net === ps[j].net) continue;
    if ([...ps[i].claves].some(w => ps[j].claves.has(w))) lateral(ps[i], ps[j]).palabras = true;
  }
  ps.forEach(n => {
    const tiene = LATERALES.some(e => e.palabras && (e.a === n || e.b === n));
    if (tiene) return;
    const otras = ps.filter(m => m !== n && (!n.net || m.net !== n.net));
    for (let k = 0; k < 2; k++) {
      const e = lateral(n, otras[Math.floor(Math.random() * otras.length)]);
      if (e) e.palabras = true;
    }
  });
})();

NODES.forEach(n => n.deg = Math.max(1, n.nbr.size));

/* ── CONEXIONES LATERALES: más malla, menos árbol ── */
(function tejerLaterales() {
  const nets = NODES.filter(n => n.type === 'netiana');
  // netianas que comparten 3 conceptos o más
  for (let i = 0; i < nets.length; i++) for (let j = i + 1; j < nets.length; j++) {
    const comun = nets[i].data.t.filter(t => nets[j].data.t.includes(t)).length;
    if (comun >= 3) lateral(nets[i], nets[j]);
  }
  // cada referente con los dos que más categorías comparten
  const refs = NODES.filter(n => n.type === 'referente');
  refs.forEach(r => {
    refs.filter(o => o !== r)
      .map(o => ({ o, c: [...r.tags].filter(t => o.tags.has(t)).length + Math.random() * 0.5 }))
      .sort((x, y) => y.c - x.c).slice(0, 2)
      .forEach(({ o, c }) => { if (c >= 2) lateral(r, o); });
  });
  // la netiana que falta se enlaza, sin jerarquía, con tres netianas al azar
  nets.slice().sort(() => Math.random() - .5).slice(0, 3).forEach(n => lateral(PROPONER, n));
  // conceptos que aparecen juntos en 3 netianas o más
  const cons = NODES.filter(n => n.type === 'concepto');
  for (let i = 0; i < cons.length; i++) for (let j = i + 1; j < cons.length; j++) {
    const juntos = nets.filter(n => n.data.t.includes(cons[i].label) && n.data.t.includes(cons[j].label)).length;
    if (juntos >= 3) lateral(cons[i], cons[j]);
  }
})();

/* ── LÍNEAS COMO RAÍCES ── */
// cada conexión es una curva en S que ondula despacio; los puntos se calculan siempre desde a hacia b
function curva(e) {
  const ax = e.a.x, ay = e.a.y, bx = e.b.x, by = e.b.y;
  const dx = bx - ax, dy = by - ay;
  const d = Math.hypot(dx, dy) || 1;
  const nx = -dy / d, ny = dx / d;
  const t = frameCount * 0.004;
  const amp = d * (e.lateral ? 0.42 : 0.32);
  const o1 = (noise(e.seed, t) - 0.5) * 2 * amp;
  const o2 = (noise(e.seed + 77, t) - 0.5) * 2 * amp;
  return [ax, ay, ax + dx / 3 + nx * o1, ay + dy / 3 + ny * o1, ax + dx * 2 / 3 + nx * o2, ay + dy * 2 / 3 + ny * o2, bx, by];
}
function puntoCurva(c, t) {
  return [bezierPoint(c[0], c[2], c[4], c[6], t), bezierPoint(c[1], c[3], c[5], c[7], t)];
}
// crecimiento: la conexión brota desde el nodo que ya estaba
function crecimiento(e) {
  const nace = Math.max(e.a.born, e.b.born);
  return easeOut(Math.max(0, Math.min(1, (frameCount - nace) / 45)));
}
const nbrsOfType = (n, type) => [...n.nbr].filter(m => m.type === type);

/* ── NODOS: los grupos surgen navegando ── */
let constel = null;   // { nombre, color, miembros: [] }

function teoriaDe(concepto) {
  const T = CONSTELACIONES.teorias;
  return Object.keys(T).find(k => k === concepto.label || (T[k].disparadores || []).includes(concepto.label));
}

function armarConstelacion(n) {
  if (n.type === 'categoria') {
    return {
      nombre: n.label,
      color: CONSTELACIONES.colores[n.label] || COL.white,
      miembros: [n, ...nbrsOfType(n, 'referente')]
    };
  }
  if (n.type === 'concepto') {
    const teo = teoriaDe(n);
    if (teo) {
      const def = CONSTELACIONES.teorias[teo];
      const nets = NODES.filter(m => m.type === 'netiana' &&
        (m.data.t.includes(teo) || (def.netianas || []).includes(m.letra) || m.nbr.has(n)));
      const cons = (def.conceptos || []).map(c => byId['t:' + c]).filter(Boolean);
      return { nombre: teo, color: def.color, miembros: [...new Set([n, ...cons, ...nets])] };
    }
    return { nombre: '#' + n.label, color: COL.mag, miembros: [n, ...nbrsOfType(n, 'netiana')] };
  }
  return null;
}

// árbol de expansión mínima: cada nodo del grupo se une con su vecino más cercano
function arbol(ms) {
  if (ms.length < 2) return [];
  const dentro = [ms[0]], fuera = ms.slice(1), aristas = [];
  while (fuera.length) {
    let best = null, bd = Infinity, bi = -1;
    dentro.forEach(a => fuera.forEach((b, i) => {
      const d = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
      if (d < bd) { bd = d; best = [a, b]; bi = i; }
    }));
    aristas.push(best);
    dentro.push(fuera.splice(bi, 1)[0]);
  }
  return aristas;
}

/* ── ESTADO ───────────────────────────────────── */
const cam = { x: 0, y: 0, z: 1, tx: null, ty: null, tz: null };
let hover = null, selected = null, calor = 1;
const recorrido = [];          // el camino que va dejando quien navega
const visibleTotal = () => NODES.filter(n => n.visible).length;

function reveal(n, from) {
  if (n.visible) return false;
  n.visible = true;
  n.born = frameCount;
  const o = from || n;
  const a = Math.random() * Math.PI * 2, r = 20 + Math.random() * 30;
  n.x = o.x + Math.cos(a) * r; n.y = o.y + Math.sin(a) * r;
  n.vx = n.vy = 0;
  return true;
}
function revealNeighbors(n) {
  let c = 0;
  n.nbr.forEach(m => { if (reveal(m, n)) c++; });
  if (c) calor = 1;
  return c;
}
const hiddenCount = n => [...n.nbr].filter(m => !m.visible).length;

let focos = [];

function resetGraph() {
  NODES.forEach(n => { n.visible = false; n.visitas = 0; });
  NODES.forEach(n => n.fijo = false);
  // sin centro: la red se reparte en varios focos, cada vez distintos
  const nf = 3 + Math.floor(Math.random() * 3);
  // los focos se reparten según la forma de la pantalla (ancha en compu, alta en celular)
  const ancho = window.innerWidth > 760;
  focos = Array.from({ length: nf }, () => ({ x: (Math.random() - .5) * (ancho ? 1500 : 520), y: (Math.random() - .5) * (ancho ? 950 : 900) }));
  NODES.filter(grande).forEach(n => {
    n.visible = true; n.born = frameCount - 60;
    n.foco = focos[Math.floor(Math.random() * nf)];
    n.x = n.foco.x + (Math.random() - .5) * 160; n.y = n.foco.y + (Math.random() - .5) * 160;
    n.vx = n.vy = 0;
  });
  NODES.filter(n => n.inicial).forEach(n => {
    n.visible = true; n.born = frameCount + Math.floor(Math.random() * 120);
    n.foco = n.net ? null : focos[Math.floor(Math.random() * focos.length)];
    const o = n.net || n.foco;
    n.x = o.x + (Math.random() - .5) * 220; n.y = o.y + (Math.random() - .5) * 220;
    n.vx = n.vy = 0;
  });
  recorrido.length = 0;
  constel = null;
  closePanel();
  calor = 1;
  for (let i = 0; i < 160; i++) step();
  fit(true);
}

/* ── FÍSICA ───────────────────────────────────── */
const LARGO = { concepto: 70, referente: 95, categoria: 80, palabra: 115 };

function step() {
  const vis = NODES.filter(n => n.visible);
  const k = 0.25 + 0.75 * calor;

  for (let i = 0; i < vis.length; i++) {
    const a = vis[i];
    for (let j = i + 1; j < vis.length; j++) {
      const b = vis[j];
      let dx = b.x - a.x, dy = b.y - a.y;
      let d2 = dx * dx + dy * dy;
      if (d2 < 1) { dx = Math.random() - .5; dy = Math.random() - .5; d2 = 1; }
      if (d2 > 160000) continue;
      const f = (grande(a) && grande(b) ? 5200 : 1700) / d2;
      const d = Math.sqrt(d2);
      const fx = dx / d * f, fy = dy / d * f;
      a.vx -= fx; a.vy -= fy; b.vx += fx; b.vy += fy;
    }
  }
  EDGES.forEach(e => {
    if (!e.a.visible || !e.b.visible) return;
    const other = e.a.type === 'netiana' ? e.b : e.a;
    const L = LARGO[other.type] || 80;
    const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    // las categorías son puentes largos y flojos: no deben juntar todo en una bola
    const f = (d - L) * (other.type === 'categoria' ? 0.003 : 0.012);
    const fx = dx / d * f, fy = dy / d * f;
    const wa = 1 / Math.sqrt(e.a.deg), wb = 1 / Math.sqrt(e.b.deg);
    e.a.vx += fx * wa; e.a.vy += fy * wa; e.b.vx -= fx * wb; e.b.vy -= fy * wb;
  });
  LATERALES.forEach(e => {
    if (!e.a.visible || !e.b.visible) return;
    const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const f = (d - 150) * 0.0004;
    e.a.vx += dx / d * f; e.a.vy += dy / d * f; e.b.vx -= dx / d * f; e.b.vy -= dy / d * f;
  });
  // el nodo activo se aprieta: un grupito de conexiones más cercanas
  if (constel) {
    const ms = constel.miembros.filter(m => m.visible);
    if (ms.length > 1) {
      const cx = ms.reduce((s, m) => s + m.x, 0) / ms.length;
      const cy = ms.reduce((s, m) => s + m.y, 0) / ms.length;
      ms.forEach(m => { m.vx += (cx - m.x) * 0.0035; m.vy += (cy - m.y) * 0.0035; });
    }
  }
  const t = frameCount * 0.004;
  vis.forEach(n => {
    // cada netiana tiende a su foco; el resto sigue a sus raíces. Casi sin gravedad global
    const fx = n.foco ? (n.foco.x - n.x) * 0.006 : -n.x * 0.00008;
    const fy = n.foco ? (n.foco.y - n.y) * 0.006 : -n.y * 0.00008;
    n.vx += fx + (noise(n.x * 0.002, t) - .5) * 0.05;
    n.vy += fy + (noise(n.y * 0.002, t + 50) - .5) * 0.05;
    // lo que alguien acomodó con el mouse queda donde lo dejó
    if (n === dragging || n.fijo) { n.vx = n.vy = 0; return; }
    n.vx *= 0.82; n.vy *= 0.82;
    const max = 12;
    n.vx = Math.max(-max, Math.min(max, n.vx)) * k;
    n.vy = Math.max(-max, Math.min(max, n.vy)) * k;
    n.x += n.vx; n.y += n.vy;
  });
  calor = Math.max(constel ? 0.15 : 0.02, calor * 0.992);
}

/* ── CÁMARA ───────────────────────────────────── */
function panelOffset() {
  const p = document.getElementById('panel');
  if (p.hidden) return { x: 0, y: 0 };
  return window.innerWidth > 760 ? { x: p.offsetWidth / 2, y: 0 } : { x: 0, y: p.offsetHeight / 2 - 45 };
}
function fit(instant) {
  const vis = NODES.filter(n => n.visible);
  if (!vis.length) return;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  vis.forEach(n => { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x); y1 = Math.max(y1, n.y); });
  const off = panelOffset();
  const w = width - off.x * 2 - 80, h = height - off.y * 2 - 170;
  const z = Math.min(2, Math.max(0.25, Math.min(w / (x1 - x0 + 140), h / (y1 - y0 + 140))));
  cam.tz = z;
  cam.tx = (x0 + x1) / 2; cam.ty = (y0 + y1) / 2 - 30 / z;
  if (instant) { cam.x = cam.tx; cam.y = cam.ty; cam.z = z; cam.tx = cam.ty = cam.tz = null; }
}
function focusOn(n) { cam.tx = n.x; cam.ty = n.y; cam.tz = Math.max(cam.z, 1); }
function updateCam() {
  if (cam.tx == null) return;
  cam.x += (cam.tx - cam.x) * 0.08;
  cam.y += (cam.ty - cam.y) * 0.08;
  if (cam.tz) cam.z += (cam.tz - cam.z) * 0.08;
  if (Math.abs(cam.tx - cam.x) < .5 && Math.abs(cam.ty - cam.y) < .5 && (!cam.tz || Math.abs(cam.tz - cam.z) < .005)) cam.tx = cam.ty = cam.tz = null;
}
function screenCenter() { const o = panelOffset(); return { x: width / 2 - o.x, y: height / 2 - o.y }; }
function toWorld(sx, sy) { const c = screenCenter(); return { x: (sx - c.x) / cam.z + cam.x, y: (sy - c.y) / cam.z + cam.y }; }
function toScreen(wx, wy) { const c = screenCenter(); return { x: (wx - cam.x) * cam.z + c.x, y: (wy - cam.y) * cam.z + c.y }; }

/* ── DIBUJO: red de código, estética JODI / VNS Matrix ── */
const GLIFO = { netiana: null, concepto: '#', referente: null, categoria: '()' };

// tamaño del glifo en unidades del mundo
function glyphSize(n) {
  if (n.type === 'palabra') return 12;
  if (grande(n)) return 32 + Math.sqrt(n.deg) * 1.4;
  if (n.type === 'referente') return 11 + Math.sqrt(n.deg) * 1.2;
  if (n.type === 'categoria') return 10 + Math.sqrt(n.deg) * 0.8;
  return 11 + Math.sqrt(n.deg) * 1.3;
}
function radius(n) {
  if (n.type === 'palabra') return n.label.length * 3;
  return glyphSize(n) * (grande(n) ? 0.75 : 0.4);
}

function glyphOf(n) {
  if (n.type === 'palabra') return n.label;
  if (grande(n)) return '[' + n.letra + ']';
  if (n.type === 'referente') {
    // los referentes son bits: cada tanto cambian de 0 a 1
    return noise(n.seed, frameCount * 0.01) > 0.5 ? '1' : '0';
  }
  return GLIFO[n.type];
}

function focusSet() {
  const f = hover || selected;
  if (!f) return null;
  const s = new Set([f]);
  f.nbr.forEach(m => s.add(m));
  if (constel && f === selected) constel.miembros.forEach(m => s.add(m));
  return s;
}

/* glitch: ráfagas al tocar y al aparecer nodos, y una base sutil siempre */
let rafaga = 0;

/* ── LA RED FUNCIONANDO: datos que viajan y ondas ── */
const paquetes = [];   // { a, b, t, v, glifo, col, salto }
const ondas = [];      // { x, y, t, col }
const MAX_PAQUETES = 70;

function enviar(a, b, salto, rapido) {
  if (paquetes.length >= MAX_PAQUETES) return;
  const tipo = a.type === 'netiana' ? b.type : a.type;
  const e = edgeMap[claveDe(a, b)];
  if (!e) return;
  paquetes.push({
    a, b, e, ida: e.a === a, t: 0,
    v: (rapido ? 0.035 : 0.006 + Math.random() * 0.01),
    glifo: random(tipo === 'concepto' ? ['#', '#', '%'] : ['0', '1', '0', '1', '¤']),
    col: TIPOS[a.type === 'netiana' ? b.type : a.type].color,
    salto
  });
}

// tráfico de fondo: la red transmite aunque nadie la toque
function trafico() {
  if (Math.random() > 0.35) return;
  const vivas = EDGES.concat(LATERALES).filter(e => e.a.visible && e.b.visible && crecimiento(e) >= 1);
  if (!vivas.length) return;
  const e = vivas[Math.floor(Math.random() * vivas.length)];
  Math.random() < .5 ? enviar(e.a, e.b, 9, false) : enviar(e.b, e.a, 9, false);
}

// una onda sale del nodo tocado y se propaga dos saltos por sus conexiones
function onda(n) {
  ondas.push({ x: n.x, y: n.y, t: 0, col: TIPOS[n.type].color });
  n.pulso = 1;
  n.nbr.forEach(m => { if (m.visible) enviar(n, m, 0, true); });
}

function actualizarPaquetes() {
  trafico();
  for (let i = paquetes.length - 1; i >= 0; i--) {
    const p = paquetes[i];
    p.t += p.v;
    if (!p.a.visible || !p.b.visible) { paquetes.splice(i, 1); continue; }
    if (p.t >= 1) {
      paquetes.splice(i, 1);
      p.b.pulso = Math.max(p.b.pulso || 0, p.salto < 9 ? 1 : 0.6);
      Sonido.dato(p.salto < 9);
      // la onda sigue un salto más, más débil
      if (p.salto === 0) {
        [...p.b.nbr].filter(m => m.visible && m !== p.a).slice(0, 4).forEach(m => enviar(p.b, m, 1, true));
      }
    }
  }
  NODES.forEach(n => { if (n.pulso) n.pulso = n.pulso > 0.01 ? n.pulso * 0.93 : 0; });
  for (let i = ondas.length - 1; i >= 0; i--) { ondas[i].t += 0.02; if (ondas[i].t >= 1) ondas.splice(i, 1); }
}

function drawPaquetes() {
  textAlign(CENTER, CENTER);
  noStroke();
  paquetes.forEach(p => {
    const c0 = curva(p.e);
    const at = tt => puntoCurva(c0, p.ida ? tt : 1 - tt);
    const [x, y] = at(Math.min(1, p.t));
    const rapido = p.salto < 9;
    // estela sobre la conexión
    const c = color(p.col);
    c.setAlpha(rapido ? 170 : 70);
    stroke(c); strokeWeight((rapido ? 1.4 : 0.8) / Math.sqrt(cam.z));
    const t0 = Math.max(0, p.t - (rapido ? 0.18 : 0.08));
    noFill();
    beginShape();
    for (let k = 0; k <= 4; k++) { const [qx, qy] = at(lerp(t0, Math.min(1, p.t), k / 4)); vertex(qx, qy); }
    endShape();
    noStroke();
    c.setAlpha(rapido ? 255 : 150);
    fill(c);
    textSize((rapido ? 11 : 8) / Math.pow(cam.z, 0.3));
    text(p.glifo, x, y);
  });
}

/* ── INVITACIÓN: un latido recorre la red cuando nadie la toca ── */
let ultimoToque = -99999;
let latido = null;          // { path: [nodos], i, p }
let proximoLatido = 90;
let llamado = null;         // { n, hasta }: el nodo donde termina el latido late pidiendo que lo toquen
const enReposo = () => millis() - ultimoToque > 5000;

// ritmo de corazón: lub-dub
function palpito() {
  const ph = (frameCount % 75) / 75;
  const g = (x, c, w) => Math.exp(-((x - c) ** 2) / (2 * w * w));
  return g(ph, 0.05, 0.03) + 0.6 * g(ph, 0.2, 0.03);
}

// forma de electrocardiograma: onda P, complejo QRS, onda T
function ecg(x) {
  const g = (c, w) => Math.exp(-((x - c) ** 2) / (2 * w * w));
  return 0.15 * g(0.15, 0.035) - 0.15 * g(0.33, 0.012) + 1 * g(0.37, 0.014) - 0.4 * g(0.41, 0.013) + 0.28 * g(0.66, 0.05);
}

function caminoLatido() {
  const vivas = EDGES.concat(LATERALES).filter(e => e.a.visible && e.b.visible && crecimiento(e) >= 1);
  const vecinos = n => vivas.filter(e => e.a === n || e.b === n).map(e => e.a === n ? e.b : e.a);
  const nets = NODES.filter(n => n.type === 'netiana' && n.visible && vecinos(n).length);
  if (!nets.length) return null;
  let actual = nets[Math.floor(Math.random() * nets.length)];
  const path = [actual];
  const saltos = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < saltos; i++) {
    let op = vecinos(actual).filter(m => !path.includes(m));
    // el último salto busca una netiana: ahí se abre la invitación
    if (i === saltos - 1) { const nn = op.filter(m => m.type === 'netiana'); if (nn.length) op = nn; }
    if (!op.length) break;
    actual = op[Math.floor(Math.random() * op.length)];
    path.push(actual);
  }
  return path.length > 1 ? { path, i: 0, p: 0 } : null;
}

function actualizarLatido() {
  if (!latido && enReposo() && frameCount >= proximoLatido) latido = caminoLatido();
  if (!latido) return;
  latido.p += 0.022;
  if (latido.p >= 1) {
    const llega = latido.path[latido.i + 1];
    llega.pulso = 1;
    Sonido.latido();
    latido.i++; latido.p = 0;
    if (latido.i >= latido.path.length - 1) {
      llamado = { n: llega, hasta: frameCount + 150 };
      latido = null;
      proximoLatido = frameCount + 100;
    }
  }
}

function drawLatido() {
  if (latido) {
    const a = latido.path[latido.i], b = latido.path[latido.i + 1];
    const e = edgeMap[claveDe(a, b)];
    if (e && a.visible && b.visible) {
      const c = curva(e);
      const ida = e.a === a;
      const at = t => puntoCurva(c, ida ? t : 1 - t);
      const W = 0.55, amp = 30 / Math.pow(cam.z, 0.75);
      noFill();
      drawingContext.shadowBlur = 12; drawingContext.shadowColor = COL.mag;
      stroke(255, 0, 255, 230);
      strokeWeight(1.5 / Math.sqrt(cam.z));
      beginShape();
      const N = 40;
      for (let k = 0; k <= N; k++) {
        const t = latido.p - W + (k / N) * W;
        if (t < 0 || t > 1) continue;
        const [x, y] = at(t);
        const [x2, y2] = at(Math.min(1, t + 0.01));
        const ang = Math.atan2(y2 - y, x2 - x);
        const h = ecg(k / N) * amp;
        vertex(x - Math.sin(ang) * h, y + Math.cos(ang) * h);
      }
      endShape();
      drawingContext.shadowBlur = 0;
      const [hx, hy] = at(Math.min(1, latido.p));
      noStroke(); fill(255, 0, 255);
      circle(hx, hy, 4 / Math.sqrt(cam.z));
    }
  }
  // el nodo donde terminó el latido pide que lo toquen
  if (llamado && frameCount < llamado.hasta && llamado.n.visible && enReposo()) {
    const n = llamado.n;
    const s = glyphSize(n) * (1.05 + 0.25 * palpito()), q = s * 0.35;
    const a = 255 * Math.min(1, (llamado.hasta - frameCount) / 40);
    stroke(255, 0, 255, a); strokeWeight(1.3 / cam.z); noFill();
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
      line(n.x + sx * s, n.y + sy * s, n.x + sx * (s - q), n.y + sy * s);
      line(n.x + sx * s, n.y + sy * s, n.x + sx * s, n.y + sy * (s - q));
    });
  }
}

function drawOndas() {
  noFill();
  ondas.forEach(o => {
    const c = color(o.col);
    c.setAlpha(200 * (1 - o.t));
    stroke(c);
    strokeWeight(1.2 / cam.z);
    const r = 12 + o.t * 140;
    // anillo cuadrado, pixelado, que se expande
    rect(o.x - r, o.y - r, r * 2, r * 2);
    if (o.t < 0.5) { c.setAlpha(120 * (1 - o.t * 2)); stroke(c); rect(o.x - r * 0.6, o.y - r * 0.6, r * 1.2, r * 1.2); }
  });
}
function glitchear(f) { rafaga = Math.max(rafaga, f); Sonido.glitch(1); }

function setup() {
  const cnv = createCanvas(window.innerWidth, window.innerHeight);
  cnv.parent('lienzo');
  pixelDensity(Math.min(2, displayDensity()));
  textFont('VT323');
  bindPointer(cnv.elt);
  bindUi();
  resetGraph();
  // la obra empieza dormida: negro y un cursor. Al primer toque, se conecta
  const conectar = () => {
    if (conectado) return;
    conectado = true;
    document.body.classList.remove('dormida');
    ultimoToque = millis();
    nacer();
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, conectar, { passive: true }));
}

/* ── ENTRADA: conectarse como a internet en los 90 ── */
let conectado = false;

// la red nace mientras suena el módem: primero las netianas, de a una, después las palabras
function nacer() {
  resetGraph();
  const orden = NODES.filter(grande).sort(() => Math.random() - .5);
  orden.forEach((n, i) => n.born = frameCount + 70 + i * 7);
  NODES.filter(n => n.inicial).forEach(n => n.born = frameCount + 190 + Math.floor(Math.random() * 150));
  glitchear(30);
}

function drawDormida() {
  background(COL.bg);
  if (frameCount % 60 < 34) {
    noStroke();
    fill(COL.green);
    drawingContext.shadowBlur = 12; drawingContext.shadowColor = COL.green;
    textFont('VT323'); textAlign(CENTER, CENTER); textSize(46);
    text('_', width / 2, height / 2);
    drawingContext.shadowBlur = 0;
  }
  postGlitch();
}

function windowResized() { resizeCanvas(window.innerWidth, window.innerHeight); }

function draw() {
  if (!conectado) return drawDormida();
  step();
  updateCam();
  background(COL.bg);

  const c = screenCenter();
  push();
  translate(c.x, c.y);
  scale(cam.z);
  translate(-cam.x, -cam.y);

  const vis = NODES.filter(n => n.visible);
  const fs = focusSet();

  drawEdges(fs);
  actualizarPaquetes();
  drawRecorrido();
  drawOndas();
  actualizarLatido();
  drawLatido();
  drawPaquetes();
  drawNodo();
  vis.forEach(n => drawGlyph(n, fs));
  vis.forEach(n => drawLabel(n, fs));
  pop();

  postGlitch();
}

function drawEdges(fs) {
  const f = hover || selected;
  noFill();
  EDGES.concat(LATERALES).forEach(e => {
    if (!e.a.visible || !e.b.visible) return;
    const lit = !e.lateral && f && (e.a === f || e.b === f) && !(constel && f === selected);
    const other = e.a.type === 'netiana' ? e.b : e.a;
    const col = color(lit ? TIPOS[other.type].color : (e.lateral ? COL.white : COL.green));
    const ruido = noise(e.seed, frameCount * 0.03);
    const base = e.palabras ? 70 : (e.lateral ? 26 : 58);
    col.setAlpha(lit ? 170 : (fs ? 10 : (ruido > 0.82 ? base * 2.6 : base)));
    stroke(col);
    strokeWeight((lit ? 1.1 : (e.lateral ? 0.45 : 0.7)) / Math.sqrt(cam.z));

    const c = curva(e);
    const g = crecimiento(e);
    if (g <= 0) return;
    // los hilos entre palabras son punteados, como texto que se cita
    if (e.palabras) drawingContext.setLineDash([3 / cam.z, 4 / cam.z]);
    // brota desde el nodo que nació antes
    const desdeA = e.a.born <= e.b.born;
    const N = 16;
    // raíz rota: cada tanto un tramo se corta (glitch)
    const corte = !lit && ruido < 0.14 ? Math.floor(N * (0.3 + ruido * 2.5)) : -1;
    beginShape();
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * g;
      const [x, y] = puntoCurva(c, desdeA ? t : 1 - t);
      if (i === corte) { endShape(); beginShape(); continue; }
      vertex(x + (i === corte + 1 ? (Math.random() - .5) * 6 : 0), y);
    }
    endShape();
    drawingContext.setLineDash([]);

    // ramificaciones: pelitos de raíz que salen de la conexión
    if (g > 0.85 && !(fs && !lit) && !e.palabras) {
      const ramas = Math.floor(e.seed % 3);
      col.setAlpha((lit ? 120 : base * 0.9) * (g - 0.85) / 0.15);
      stroke(col);
      strokeWeight(0.4 / Math.sqrt(cam.z));
      for (let r = 0; r < ramas; r++) {
        const t = 0.25 + ((e.seed * (r + 1) * 7.13) % 1) * 0.5;
        const [px, py] = puntoCurva(c, t);
        const [qx, qy] = puntoCurva(c, t + 0.02);
        const ang = Math.atan2(qy - py, qx - px) + (r % 2 ? 1 : -1) * (0.7 + 0.4 * noise(e.seed + r, frameCount * 0.01));
        const L = 7 + ((e.seed * (r + 3)) % 14);
        const mx = px + Math.cos(ang) * L * 0.5, my = py + Math.sin(ang) * L * 0.5;
        const a2 = ang + (r % 2 ? 0.5 : -0.5);
        line(px, py, mx, my);
        line(mx, my, mx + Math.cos(a2) * L * 0.5, my + Math.sin(a2) * L * 0.5);
      }
    }
  });
}

function drawRecorrido() {
  if (recorrido.length < 2) return;
  noFill();
  stroke(255, 0, 255, 80);
  strokeWeight(0.8 / cam.z);
  drawingContext.setLineDash([2 / cam.z, 5 / cam.z]);
  beginShape();
  recorrido.forEach(n => vertex(n.x, n.y));
  endShape();
  drawingContext.setLineDash([]);
}

// el nodo que surge al navegar: sus miembros se unen con trazos en escalera, como un circuito
function drawNodo() {
  if (!constel) return;
  const ms = constel.miembros.filter(m => m.visible);
  const col = color(constel.color);
  col.setAlpha(200);
  stroke(col);
  strokeWeight(1.1 / Math.sqrt(cam.z));
  noFill();
  arbol(ms).forEach(([a, b], i) => {
    const mx = i % 2 ? a.x : b.x;
    const my = i % 2 ? b.y : a.y;
    line(a.x, a.y, mx, my);
    line(mx, my, b.x, b.y);
  });
  // marco de la zona del nodo
  const xs = ms.map(m => m.x), ys = ms.map(m => m.y);
  const x0 = Math.min(...xs) - 26, y0 = Math.min(...ys) - 26, x1 = Math.max(...xs) + 26, y1 = Math.max(...ys) + 26;
  col.setAlpha(70);
  stroke(col);
  drawingContext.setLineDash([6 / cam.z, 4 / cam.z]);
  rect(x0, y0, x1 - x0, y1 - y0);
  drawingContext.setLineDash([]);
  noStroke();
  col.setAlpha(230); fill(col);
  textAlign(LEFT, BOTTOM);
  textSize(19 / Math.sqrt(cam.z));
  const cursor = frameCount % 40 < 20 ? '_' : ' ';
  text('> ' + constel.nombre + cursor, x0, y0 - 4 / cam.z);
}

function drawPalabra(n, fs) {
  const age = frameCount - n.born;
  if (age < 0) return;
  const dim = fs && !fs.has(n);
  // aparecen y desaparecen: cada palabra respira a su ritmo
  const resp = noise(n.seed, frameCount * 0.008);
  let a = n === hover ? 255 : (dim ? 30 : 40 + 200 * Math.max(0, resp - 0.3) / 0.7);
  // se escriben letra por letra, como una terminal
  let txt = n.label.slice(0, Math.floor(age / 2));
  if (age < n.label.length * 2) { txt += random(['_', '█', '▓']); if (age % 2 === 0) Sonido.tecla(); }
  else if (Math.random() < 0.01) txt = txt.replace(/[a-záéíóú]/i, random(['%', '#', '0', '1']));
  noStroke();
  textFont('Share Tech Mono');
  textSize(glyphSize(n) / Math.pow(cam.z, 0.35));
  textAlign(CENTER, CENTER);
  const col = color(n === hover ? COL.mag : COL.white);
  if (!dim && resp > 0.75) { fill(255, 0, 255, a * 0.4); text(txt, n.x - 1.5, n.y); }
  col.setAlpha(a);
  fill(col);
  text(txt, n.x, n.y);
  textFont('VT323');
}

function drawGlyph(n, fs) {
  if (n.type === 'palabra') return drawPalabra(n, fs);
  const age = frameCount - n.born;
  if (age < 0) return;
  if (age === 0) Sonido.dato(true);   // cada nodo que nace suena
  const dim = fs && !fs.has(n);
  const hid = hiddenCount(n);
  const lat = n.pulso || 0;
  // en reposo, las netianas palpitan: la red está viva y se puede tocar
  const palp = grande(n) && enReposo() ? 0.08 * palpito() : 0;
  const sz = glyphSize(n) * (n === hover ? 1.2 : 1) * (1 + 0.45 * lat + palp);
  const g = glyphOf(n);
  const base = color(TIPOS[n.type].color);

  // al nacer: aparece como ruido y se estabiliza
  let gx = 0, gy = 0, txt = g;
  if (age < 26) {
    gx = (Math.random() - .5) * 10; gy = (Math.random() - .5) * 4;
    if (Math.random() < 0.6) txt = random(['%', '$', '&', '?', '@', '▓', '░', '¤', g]);
  } else if (Math.random() < 0.004) {
    gx = (Math.random() - .5) * 8;
  }

  push();
  translate(n.x, n.y);
  textAlign(CENTER, CENTER);
  textSize(sz);
  noStroke();
  const a = dim ? 55 : 255;

  if (n === selected) {
    // video inverso, como un cursor de terminal
    const w = textWidth(txt) + sz * 0.3;
    fill(base); rect(-w / 2, -sz * 0.55, w, sz * 1.05);
    fill(COL.bg); text(txt, 0, -sz * 0.06);
  } else {
    // aberración cromática: canal magenta y cian desplazados
    if (!dim && (age < 26 || n === hover || grande(n))) {
      const off = (age < 26 ? 3 : 1) * (0.6 + Math.random() * 0.6);
      fill(255, 0, 255, a * 0.55); text(txt, gx - off, gy - sz * 0.06);
      fill(0, 255, 255, a * 0.45); text(txt, gx + off, gy - sz * 0.06);
    }
    base.setAlpha(a);
    if ((grande(n) || lat > 0.2) && !dim) { drawingContext.shadowBlur = 10 + 18 * lat; drawingContext.shadowColor = TIPOS[n.type].color; }
    fill(base); text(txt, gx, gy - sz * 0.06);
    drawingContext.shadowBlur = 0;
  }

  // cursor parpadeante: este nodo todavía tiene conexiones por descubrir
  if ((hid > 0 || n.type === 'proponer') && !dim && n !== selected && frameCount % 50 < 25 + (n.seed % 10)) {
    const c2 = color(n.type === 'netiana' ? COL.mag : TIPOS[n.type].color);
    c2.setAlpha(200);
    fill(c2);
    textSize(sz * 0.8);
    textAlign(LEFT, CENTER);
    text('_', textWidth(g) / 2 + sz * 0.05, sz * 0.05);
  }

  // marca de anclado: esquinas mínimas alrededor del nodo que alguien acomodó
  if (n.fijo && !dim) {
    const s = sz * 0.75, q = sz * 0.22;
    stroke(255, 0, 255, 160); strokeWeight(0.8 / cam.z); noFill();
    line(-s, -s, -s + q, -s); line(-s, -s, -s, -s + q);
    line(s, s, s - q, s); line(s, s, s, s - q);
    noStroke();
  }
  pop();
}

function drawLabel(n, fs) {
  if (n.type === 'palabra') return;
  const age = frameCount - n.born;
  if (age < 0) return;
  const focused = fs && fs.has(n);
  const dim = fs && !focused;
  const show = grande(n) || focused || age < 90 ||
    (n.type === 'referente' && cam.z > 1.4) ||
    (n.type !== 'referente' && cam.z > 1.1);
  if (!show) return;

  let a = 220;
  if (dim) a = 45;
  else if (!focused && !grande(n) && age < 90 && cam.z <= 1.1) a = 220 * (1 - age / 90);

  noStroke();
  if (grande(n)) {
    textFont('Share Tech Mono');
    textSize(13 / Math.pow(cam.z, 0.6));
    textAlign(CENTER, TOP);
    const cw = color(COL.white); cw.setAlpha(a * 0.9); fill(cw);
    text(n.label.toLowerCase(), n.x, n.y + glyphSize(n) * 0.5);
    textFont('VT323');
    return;
  }
  const lbl = n.label;
  textFont('Share Tech Mono');
  textSize(9 / Math.pow(cam.z, 0.6));
  textAlign(LEFT, CENTER);
  const col = color(TIPOS[n.type].color); col.setAlpha(a);
  fill(col);
  text(lbl, n.x + glyphSize(n) * 0.55, n.y);
  textFont('VT323');
}

// glitch de pantalla: franjas horizontales desplazadas y barras de color
function postGlitch() {
  if (rafaga > 0) rafaga--;
  const intens = rafaga > 0 ? 1 : (Math.random() < 0.025 ? 0.35 : 0);
  if (intens === 0.35) Sonido.glitch(0.3);
  if (!intens) return;
  const ctx = drawingContext, cv = ctx.canvas;
  const d = pixelDensity();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const franjas = Math.ceil((rafaga > 0 ? 5 : 1) * Math.random() + 1);
  for (let i = 0; i < franjas; i++) {
    const y = Math.random() * cv.height;
    const h = (4 + Math.random() * (rafaga > 0 ? 40 : 14)) * d;
    const dx = (Math.random() - .5) * (rafaga > 0 ? 70 : 24) * d;
    ctx.drawImage(cv, 0, y, cv.width, h, dx, y, cv.width, h);
    if (Math.random() < 0.5 * intens) {
      ctx.fillStyle = Math.random() < .5 ? 'rgba(255,0,255,0.18)' : 'rgba(0,255,255,0.14)';
      ctx.fillRect(0, y, cv.width, h * 0.5);
    }
  }
  ctx.restore();
}

const easeOut = t => 1 - Math.pow(1 - t, 3);

/* ── PUNTERO: mouse, touch y pinch ───────────── */
let dragging = null, panning = false, downAt = null, moved = 0;
const pointers = new Map();
let pinchStart = null;

function nodeAt(sx, sy) {
  const w = toWorld(sx, sy);
  let best = null, bd = Infinity;
  NODES.forEach(n => {
    if (!n.visible || frameCount < n.born) return;
    const d = Math.hypot(n.x - w.x, n.y - w.y);
    const hit = Math.max(radius(n) * (grande(n) ? 3 : 2), 11 / cam.z);
    if (d < hit && d < bd) { best = n; bd = d; }
  });
  return best;
}

function bindPointer(el) {
  el.addEventListener('pointerdown', e => {
    ultimoToque = millis(); llamado = null;
    el.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [p, q] = [...pointers.values()];
      pinchStart = { d: Math.hypot(p.x - q.x, p.y - q.y), z: cam.z };
      dragging = null; panning = false;
      return;
    }
    downAt = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y };
    moved = 0;
    const n = nodeAt(e.clientX, e.clientY);
    if (n) { dragging = n; calor = Math.max(calor, 0.4); }
    else panning = true;
    cam.tx = cam.ty = cam.tz = null;
  });

  el.addEventListener('pointermove', e => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinchStart && pointers.size === 2) {
      const [p, q] = [...pointers.values()];
      cam.z = Math.min(4, Math.max(0.2, pinchStart.z * Math.hypot(p.x - q.x, p.y - q.y) / pinchStart.d));
      return;
    }
    if (downAt) {
      moved = Math.max(moved, Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y));
      if (dragging) {
        const w = toWorld(e.clientX, e.clientY);
        dragging.x = w.x; dragging.y = w.y; dragging.vx = dragging.vy = 0;
        el.style.cursor = 'grabbing';
        calor = Math.max(calor, 0.3);
      } else if (panning) {
        cam.x = downAt.cx - (e.clientX - downAt.x) / cam.z;
        cam.y = downAt.cy - (e.clientY - downAt.y) / cam.z;
      }
      return;
    }
    if (e.pointerType === 'mouse') {
      const n = nodeAt(e.clientX, e.clientY);
      if (n && n !== hover) Sonido.roce();
      hover = n;
      el.style.cursor = n ? 'grab' : 'crosshair';
      showTooltip(n, e.clientX, e.clientY);
    }
  });

  const up = e => {
    pointers.delete(e.pointerId);
    if (pinchStart) { if (pointers.size < 2) pinchStart = null; downAt = null; return; }
    if (downAt && moved < 6) {
      const n = nodeAt(e.clientX, e.clientY);
      if (n) elegir(n);
    } else if (dragging && moved >= 6) {
      dragging.fijo = true;
      Sonido.anclar();
    }
    dragging = null; panning = false; downAt = null;
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  // doble clic sobre un nodo acomodado: lo suelta y vuelve a flotar
  el.addEventListener('dblclick', e => {
    const n = nodeAt(e.clientX, e.clientY);
    if (n && n.fijo) { n.fijo = false; calor = Math.max(calor, 0.4); Sonido.soltar(); }
  });
  el.addEventListener('pointerleave', () => { if (!downAt) { hover = null; showTooltip(null); } });

  el.addEventListener('wheel', e => {
    ultimoToque = millis();
    e.preventDefault();
    const before = toWorld(e.clientX, e.clientY);
    cam.z = Math.min(4, Math.max(0.2, cam.z * Math.exp(-e.deltaY * 0.0015)));
    const after = toWorld(e.clientX, e.clientY);
    cam.x += before.x - after.x; cam.y += before.y - after.y;
    cam.tx = cam.ty = cam.tz = null;
  }, { passive: false });
}

function showTooltip(n, x, y) {
  const tt = document.getElementById('tooltip');
  if (!n) { tt.hidden = true; return; }
  const h = hiddenCount(n);
  let s = `<span style="color:${TIPOS[n.type].color}">${esc(n.label)}</span>`;
  if (n.type === 'netiana') s = `<span style="color:${COL.green}">(${n.letra})</span> ${n.label} · ${n.data.n}`;
  tt.innerHTML = s;
  tt.hidden = false;
  tt.style.left = Math.min(x + 14, window.innerWidth - 270) + 'px';
  tt.style.top = (y + 14) + 'px';
}

/* ── SELECCIÓN: navegar es devenir ───────────── */
function elegir(n) {
  Sonido.toque(n.type);
  // una palabra lleva a su netiana; las palabras sueltas, a cualquiera
  if (n.type === 'palabra') {
    onda(n);
    const nets = NODES.filter(m => m.type === 'netiana');
    n = n.net || nets[Math.floor(Math.random() * nets.length)];
  }
  if (!n.visible) reveal(n, selected || { x: cam.x, y: cam.y });
  selected = n;
  n.visitas++;
  if (recorrido[recorrido.length - 1] !== n) recorrido.push(n);
  if (recorrido.length > 40) recorrido.shift();
  revealNeighbors(n);
  constel = armarConstelacion(n);
  if (constel) constel.miembros.forEach(m => reveal(m, n));
  calor = 1;
  glitchear(14);
  onda(n);
  openPanel(n);
  focusOn(n);
}

/* ── PANEL ───────────────────────────────────── */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const btnNode = (m, cls, txt) => `<button class="p-tag ${cls}" data-node="${esc(m.id)}">${txt}</button>`;

function itemRef(m) {
  const img = m.ref.img ? `<img src="${IMG_BASE + m.ref.img}" alt="" loading="lazy" onerror="this.remove()">` : '';
  return `<button class="p-item" data-node="${esc(m.id)}">${img}<div><div class="t">${esc(m.label)}</div><div class="s">${esc([m.pais, m.anio].filter(Boolean).join(' · '))}</div></div></button>`;
}
function itemNet(m) {
  return `<button class="p-item n" data-node="${esc(m.id)}"><span class="l">${m.letra}</span><div><div class="t">${esc(m.label)}</div><div class="s">${esc(m.data.n)}</div></div></button>`;
}

function openPanel(n) {
  const p = document.getElementById('panel');
  const body = document.getElementById('pn-body');
  const path = document.getElementById('pn-path');
  let h = '';

  if (n.type === 'netiana') {
    const d = n.data;
    path.innerHTML = `netianas.net / <span>(${n.letra}) ${esc(d.a.toLowerCase())}</span>`;
    const shared = {};
    nbrsOfType(n, 'concepto').forEach(t => nbrsOfType(t, 'netiana').forEach(o => {
      if (o !== n) (shared[o.id] = shared[o.id] || []).push(t.label);
    }));
    const conns = Object.entries(shared).sort((a, b) => b[1].length - a[1].length).slice(0, 6);
    h = `<div class="p-letter">${n.letra}</div>
      <div class="p-alias">${esc(d.a)}</div>
      <div class="p-name">${esc(d.n)}</div>
      <div class="p-desc">${d.d}</div>
      <div class="p-sep"></div>
      <div class="p-body">${d.b}</div>
      <div class="p-sec">//</div>
      <div class="p-tags">${nbrsOfType(n, 'concepto').map(t => btnNode(t, '', '#' + esc(t.label))).join('')}</div>
      <div class="p-sec">//</div>
      <div class="p-list">${nbrsOfType(n, 'referente').map(itemRef).join('')}</div>
      <div class="p-sec">//</div>
      <div class="p-list">${conns.map(([id, ts]) => {
        const o = byId[id];
        return `<button class="p-item n" data-node="${esc(id)}"><span class="l">${o.letra}</span><div><div class="t">${esc(o.label)}</div><div class="s">vía ${esc(ts.slice(0, 3).join(', '))}${ts.length > 3 ? '…' : ''}</div></div></button>`;
      }).join('')}</div>`;
  }

  if (n.type === 'concepto') {
    const teo = teoriaDe(n);
    const nets = constel ? constel.miembros.filter(m => m.type === 'netiana') : nbrsOfType(n, 'netiana');
    const otros = constel ? constel.miembros.filter(m => m.type === 'concepto' && m !== n) : [];
    path.innerHTML = `netianas.net / <span>#${esc(n.label)}</span>`;
    h = `      <div class="p-name" style="color:${constel ? constel.color : COL.mag}">#${esc(n.label)}</div>
      ${otros.length ? `<div class="p-tags" style="margin-bottom:.8rem">${otros.map(t => btnNode(t, '', '#' + esc(t.label))).join('')}</div>` : ''}
      <div class="p-list">${nets.map(itemNet).join('')}</div>`;
  }

  if (n.type === 'referente') {
    const r = n.ref;
    const nets = nbrsOfType(n, 'netiana');
    const cats = nbrsOfType(n, 'categoria');
    path.innerHTML = `netianas.net / <span>${esc(n.label.toLowerCase())}</span>`;
    h = `      <div class="p-name" style="color:${COL.cyan}">${esc(r.title)}</div>
      <div class="p-meta">${esc([n.pais, n.anio].filter(Boolean).join(' · '))}</div>
      ${r.img ? `<img class="p-img" src="${IMG_BASE + r.img}" alt="${esc(r.title)}" loading="lazy" onerror="this.remove()">` : ''}
      <div class="p-body">${r.body}</div>
      <div class="p-sec">//</div>
      <div class="p-tags">${cats.map(c => btnNode(c, 'cat', '(' + esc(c.label) + ')')).join('')}</div>
      <div class="p-sec">//</div>
      <div class="p-list">${nets.map(itemNet).join('')}</div>`;
  }

  if (n.type === 'categoria') {
    const refs = nbrsOfType(n, 'referente');
    path.innerHTML = `netianas.net / <span>(${esc(n.label)})</span>`;
    h = `      <div class="p-name" style="color:${constel ? constel.color : COL.white}">(${esc(n.label)})</div>
      <div class="p-list">${refs.map(itemRef).join('')}</div>`;
  }

  // la netiana que falta: el formulario de sugerencias se abre acá, sin salir de la obra
  if (n.type === 'proponer') {
    path.innerHTML = `netianas.net / <span>tu netiana</span>`;
    h = `<iframe class="p-form" src="${FORM_URL}" title="Proponé una netiana" loading="lazy"></iframe>`;
  }
  p.classList.toggle('con-form', n.type === 'proponer');

  body.innerHTML = h;
  body.scrollTop = 0;
  p.hidden = false;
  document.body.classList.add('panel-open');
}

function closePanel() {
  document.getElementById('panel').hidden = true;
  document.body.classList.remove('panel-open');
  selected = null;
  constel = null;
}

/* ── INTERFAZ MÍNIMA ─────────────────────────── */
function bindUi() {
  document.getElementById('pn-close').addEventListener('click', closePanel);
  document.getElementById('pn-body').addEventListener('click', e => {
    const b = e.target.closest('[data-node]');
    if (b && byId[b.dataset.node]) elegir(byId[b.dataset.node]);
  });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });
}

function desplegarTodo() {
  let ola = 0;
  const tick = () => {
    const frontera = NODES.filter(n => n.visible && hiddenCount(n) > 0);
    if (!frontera.length || ola > 6) { setTimeout(() => fit(false), 600); return; }
    frontera.forEach(n => n.nbr.forEach(m => reveal(m, n)));
    glitchear(10);
    calor = 1; ola++;
    setTimeout(tick, 450);
  };
  tick();
}
