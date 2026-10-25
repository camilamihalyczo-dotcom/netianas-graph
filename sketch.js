/* ══════════════════════════════════════
   N(H)ACER MUJER EN INTERNET · grafo rizomático
   p5.js + física propia. Sin centro, sin origen,
   sin un orden correcto de lectura.
══════════════════════════════════════ */

const IMG_BASE = 'https://netianas.vercel.app/img/';

const COL = {
  bg: '#050505', green: '#00ff41', gd: '#00aa2a', gf: '#001a00',
  mag: '#ff00ff', magd: '#880088', cyan: '#00ffff', white: '#e0ffe0'
};

const TIPOS = {
  netiana:   { color: COL.green, nombre: 'netiana' },
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
    visible: false, born: -999, nbr: new Set(), grupos: []
  }, props);
  NODES.push(n);
  byId[id] = n;
  return n;
}
function link(a, b) {
  const k = a.id < b.id ? a.id + '|' + b.id : b.id + '|' + a.id;
  if (edgeKeys.has(k)) return;
  edgeKeys.add(k);
  EDGES.push({ a, b, seed: Math.random() * 1000 });
  a.nbr.add(b); b.nbr.add(a);
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

NODES.forEach(n => n.deg = n.nbr.size);
const nbrsOfType = (n, type) => [...n.nbr].filter(m => m.type === type);

/* ── AGRUPACIONES ─────────────────────────────── */
let modoGrupo = 'ninguna';
let grupoColor = {};
let grupoAncla = {};

function asignarGrupos(modo) {
  modoGrupo = modo;
  NODES.forEach(n => n.grupos = []);
  const cfg = GRUPOS[modo];
  grupoColor = Object.assign({}, cfg.colores || {});

  if (modo === 'region' || modo === 'medio') {
    NODES.filter(n => n.type === 'referente').forEach(n => {
      n.tags.forEach(t => { if (cfg.tags[t]) n.grupos.push(cfg.tags[t]); });
    });
    // la categoría misma también pertenece a su grupo
    Object.entries(cfg.tags).forEach(([t, g]) => { if (byId['c:' + t]) byId['c:' + t].grupos.push(g); });
  }
  if (modo === 'tipo') {
    NODES.filter(n => n.type === 'referente').forEach(n => {
      n.grupos.push(n.tags.has('colectivo') ? 'Colectivos' : 'Individuales');
    });
    if (byId['c:colectivo']) byId['c:colectivo'].grupos.push('Colectivos');
  }
  if (modo === 'teoria') {
    Object.entries(cfg.teorias).forEach(([teo, def]) => {
      NODES.filter(n => n.type === 'netiana').forEach(n => {
        if (n.data.t.includes(teo) || (def.netianas || []).includes(n.letra)) n.grupos.push(teo);
      });
      (def.conceptos || []).forEach(c => { if (byId['t:' + c]) byId['t:' + c].grupos.push(teo); });
    });
  }
  let i = 0;
  NODES.forEach(n => n.grupos.forEach(g => { if (!grupoColor[g]) grupoColor[g] = PALETA[i++ % PALETA.length]; }));
  // cada grupo recibe un ancla en un anillo, en orden al azar: tampoco acá hay jerarquía
  const nombres = Object.keys(grupoColor).sort(() => Math.random() - .5);
  const off = Math.random() * Math.PI * 2;
  grupoAncla = {};
  nombres.forEach((g, j) => {
    const a = off + j / nombres.length * Math.PI * 2;
    grupoAncla[g] = { x: Math.cos(a) * 360, y: Math.sin(a) * 360 };
  });
  calor = Math.max(calor, 1);
}

/* ── ESTADO ───────────────────────────────────── */
const cam = { x: 0, y: 0, z: 1, tx: null, ty: null };
let hover = null, selected = null, calor = 1;
const filtros = { concepto: true, referente: true, categoria: true };
const visibleTotal = () => NODES.filter(isShown).length;

function isShown(n) { return n.visible && (n.type === 'netiana' || filtros[n.type]); }

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
const hiddenCount = n => [...n.nbr].filter(m => !m.visible || !isShown(m)).length;

function resetGraph() {
  NODES.forEach(n => n.visible = false);
  const N = NODES.filter(n => n.type === 'netiana');
  N.forEach((n, i) => {
    n.visible = true; n.born = frameCount - 60;
    // posición al azar: no hay centro
    const a = Math.random() * Math.PI * 2, r = 60 + Math.random() * 170;
    n.x = Math.cos(a) * r; n.y = Math.sin(a) * r; n.vx = n.vy = 0;
  });
  selected = null;
  closePanel();
  calor = 1;
  for (let i = 0; i < 160; i++) step();
  fit(true);
}

/* ── FÍSICA ───────────────────────────────────── */
const LARGO = { concepto: 70, referente: 95, categoria: 80 };

function step() {
  const vis = NODES.filter(isShown);
  const k = 0.25 + 0.75 * calor;

  // repulsión entre todos los nodos visibles
  for (let i = 0; i < vis.length; i++) {
    const a = vis[i];
    for (let j = i + 1; j < vis.length; j++) {
      const b = vis[j];
      let dx = b.x - a.x, dy = b.y - a.y;
      let d2 = dx * dx + dy * dy;
      if (d2 < 1) { dx = Math.random() - .5; dy = Math.random() - .5; d2 = 1; }
      if (d2 > 160000) continue;
      const f = (a.type === 'netiana' && b.type === 'netiana' ? 5200 : 1700) / d2;
      const d = Math.sqrt(d2);
      const fx = dx / d * f, fy = dy / d * f;
      a.vx -= fx; a.vy -= fy; b.vx += fx; b.vy += fy;
    }
  }
  // resortes en las conexiones
  EDGES.forEach(e => {
    if (!isShown(e.a) || !isShown(e.b)) return;
    const other = e.a.type === 'netiana' ? e.b : e.a;
    const L = LARGO[other.type] || 80;
    const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const f = (d - L) * 0.012;
    const fx = dx / d * f, fy = dy / d * f;
    // los nodos con más conexiones se mueven menos
    const wa = 1 / Math.sqrt(e.a.deg), wb = 1 / Math.sqrt(e.b.deg);
    e.a.vx += fx * wa; e.a.vy += fy * wa; e.b.vx -= fx * wb; e.b.vy -= fy * wb;
  });
  // agrupaciones: cada miembro es atraído al centro de cada grupo al que pertenece
  if (modoGrupo !== 'ninguna') {
    const cen = {};
    vis.forEach(n => n.grupos.forEach(g => {
      (cen[g] = cen[g] || { x: 0, y: 0, c: 0 });
      cen[g].x += n.x; cen[g].y += n.y; cen[g].c++;
    }));
    vis.forEach(n => n.grupos.forEach(g => {
      const c = cen[g], an = grupoAncla[g];
      const kk = 1 / n.grupos.length;
      // hacia su ancla (separa los grupos) y hacia el centro del grupo (lo aprieta)
      n.vx += ((an.x - n.x) * 0.012 + (c.c > 1 ? (c.x / c.c - n.x) * 0.014 : 0)) * kk;
      n.vy += ((an.y - n.y) * 0.012 + (c.c > 1 ? (c.y / c.c - n.y) * 0.014 : 0)) * kk;
    }));
  }
  // gravedad suave + deriva (rizoma vivo)
  const t = frameCount * 0.004;
  vis.forEach(n => {
    n.vx += -n.x * 0.0009 + (noise(n.x * 0.002, t) - .5) * 0.05;
    n.vy += -n.y * 0.0009 + (noise(n.y * 0.002, t + 50) - .5) * 0.05;
    if (n === dragging) return;
    n.vx *= 0.82; n.vy *= 0.82;
    const max = 12;
    n.vx = Math.max(-max, Math.min(max, n.vx)) * k;
    n.vy = Math.max(-max, Math.min(max, n.vy)) * k;
    n.x += n.vx; n.y += n.vy;
  });
  calor = Math.max(0.02, calor * 0.992);
}

/* ── CÁMARA ───────────────────────────────────── */
function panelOffset() {
  const p = document.getElementById('panel');
  if (p.hidden) return { x: 0, y: 0 };
  return window.innerWidth > 760 ? { x: p.offsetWidth / 2, y: 0 } : { x: 0, y: p.offsetHeight / 2 - 55 };
}
function fit(instant) {
  const vis = NODES.filter(isShown);
  if (!vis.length) return;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  vis.forEach(n => { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x); y1 = Math.max(y1, n.y); });
  const off = panelOffset();
  const w = width - off.x * 2 - 80, h = height - off.y * 2 - 220;
  const z = Math.min(2, Math.max(0.25, Math.min(w / (x1 - x0 + 120), h / (y1 - y0 + 120))));
  cam.tz = z;
  cam.tx = (x0 + x1) / 2; cam.ty = (y0 + y1) / 2 - 40 / z;
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

/* ── DIBUJO ───────────────────────────────────── */
function radius(n) {
  if (n.type === 'netiana') return 15 + Math.sqrt(n.deg) * 1.6;
  if (n.type === 'referente') return 4 + Math.sqrt(n.deg) * 1.2;
  if (n.type === 'categoria') return 4 + Math.sqrt(n.deg) * 0.9;
  return 3.5 + Math.sqrt(n.deg) * 1.4;
}

function focusSet() {
  const f = hover || selected;
  if (!f) return null;
  const s = new Set([f]);
  f.nbr.forEach(m => s.add(m));
  return s;
}

function setup() {
  const cnv = createCanvas(window.innerWidth, window.innerHeight);
  cnv.parent('lienzo');
  pixelDensity(Math.min(2, displayDensity()));
  textFont('Share Tech Mono');
  bindPointer(cnv.elt);
  buildHud();
  asignarGrupos('ninguna');
  resetGraph();
}

function windowResized() { resizeCanvas(window.innerWidth, window.innerHeight); }

function draw() {
  step();
  updateCam();
  background(COL.bg);

  const c = screenCenter();
  push();
  translate(c.x, c.y);
  scale(cam.z);
  translate(-cam.x, -cam.y);

  const vis = NODES.filter(isShown);
  const fs = focusSet();

  drawGrupos(vis);
  drawEdges(fs);
  vis.forEach(n => drawNode(n, fs));
  vis.forEach(n => drawLabel(n, fs));
  pop();

  updateContador(vis.length);
}

function drawGrupos(vis) {
  if (modoGrupo === 'ninguna') return;
  const cen = {};
  noStroke();
  vis.forEach(n => n.grupos.forEach(g => {
    const col = color(grupoColor[g]);
    col.setAlpha(16);
    fill(col);
    circle(n.x, n.y, 92);
    col.setAlpha(26);
    fill(col);
    circle(n.x, n.y, 46);
    (cen[g] = cen[g] || { x: 0, y: 0, c: 0, m: [] });
    cen[g].x += n.x; cen[g].y += n.y; cen[g].c++; cen[g].m.push(n);
  }));
  textAlign(CENTER, BOTTOM);
  textFont('VT323');
  Object.entries(cen).forEach(([g, c]) => {
    if (c.c < 2) return;
    const col = color(grupoColor[g]);
    col.setAlpha(210);
    fill(col);
    textSize(22 / Math.sqrt(cam.z));
    // la etiqueta va del lado de afuera del cúmulo, en dirección a su ancla
    const cx = c.x / c.c, cy = c.y / c.c;
    const rad = Math.max(...c.m.map(n => Math.hypot(n.x - cx, n.y - cy))) + 56;
    const an = grupoAncla[g];
    const L = Math.hypot(an.x, an.y) || 1;
    text(g.toUpperCase() + ' · ' + c.c, cx + an.x / L * rad, cy + an.y / L * rad + 8);
  });
  textFont('Share Tech Mono');
}

function drawEdges(fs) {
  EDGES.forEach(e => {
    if (!isShown(e.a) || !isShown(e.b)) return;
    const lit = fs && fs.has(e.a) && fs.has(e.b) && (e.a === (hover || selected) || e.b === (hover || selected));
    const other = e.a.type === 'netiana' ? e.b : e.a;
    const col = color(lit ? TIPOS[other.type].color : COL.green);
    // titileo de la red: cada tanto una conexión destella
    const flick = noise(e.seed, frameCount * 0.03) > 0.78 ? 1.8 : 1;
    const apagada = modoGrupo !== 'ninguna' && (!e.a.grupos.length || !e.b.grupos.length);
    col.setAlpha(lit ? 200 : (fs ? 18 : (apagada ? 16 : 42) * flick));
    stroke(col);
    strokeWeight((lit ? 1.4 : 0.7) / cam.z ** 0.5);
    line(e.a.x, e.a.y, e.b.x, e.b.y);
  });
}

function drawNode(n, fs) {
  const age = frameCount - n.born;
  const grow = Math.min(1, age / 18);
  let r = radius(n) * (0.2 + 0.8 * easeOut(grow));
  const sinGrupo = modoGrupo !== 'ninguna' && !n.grupos.length && n.type !== 'netiana';
  const dim = (fs && !fs.has(n)) || (!fs && sinGrupo);
  const col = color(TIPOS[n.type].color);
  if (dim) col.setAlpha(sinGrupo && !fs ? 70 : 60);

  // glitch al nacer
  let gx = 0, gy = 0;
  if (age < 22 && Math.random() < 0.35) { gx = (Math.random() - .5) * 8; gy = (Math.random() - .5) * 3; }

  push();
  translate(n.x + gx, n.y + gy);

  // anillo de lo que falta descubrir
  const h = hiddenCount(n);
  if (h > 0 && !dim) {
    noFill();
    const pc = color(n.type === 'netiana' ? COL.mag : COL.gd);
    pc.setAlpha(90 + 70 * Math.sin(frameCount * 0.06 + n.x));
    stroke(pc);
    strokeWeight(1 / cam.z);
    drawingContext.setLineDash([3 / cam.z, 4 / cam.z]);
    circle(0, 0, (r + 6) * 2);
    drawingContext.setLineDash([]);
  }

  if (n === selected) {
    noFill(); stroke(COL.mag); strokeWeight(1.6 / cam.z);
    circle(0, 0, (r + 10) * 2 + Math.sin(frameCount * 0.1) * 2);
  }

  if (n.type === 'netiana') {
    fill(COL.bg); stroke(col); strokeWeight(n === hover ? 2.2 : 1.4);
    if (!dim) drawingContext.shadowBlur = 14, drawingContext.shadowColor = COL.green;
    circle(0, 0, r * 2);
    drawingContext.shadowBlur = 0;
    noStroke(); fill(col);
    textFont('VT323'); textAlign(CENTER, CENTER); textSize(r * 1.35);
    text(n.letra, 0, -r * 0.08);
    textFont('Share Tech Mono');
  } else if (n.type === 'categoria') {
    noFill(); stroke(col); strokeWeight(1.2);
    rotate(PI / 4); rectMode(CENTER); square(0, 0, r * 1.7);
  } else {
    noStroke(); fill(col);
    if (!dim && (n === hover || n === selected)) drawingContext.shadowBlur = 10, drawingContext.shadowColor = TIPOS[n.type].color;
    circle(0, 0, r * 2);
    drawingContext.shadowBlur = 0;
  }
  pop();
}

function drawLabel(n, fs) {
  const age = frameCount - n.born;
  const focused = fs && fs.has(n);
  const dim = (fs && !focused) || (!fs && modoGrupo !== 'ninguna' && !n.grupos.length && n.type !== 'netiana');
  let show = n.type === 'netiana' || focused || age < 90 ||
    (n.type === 'referente' && cam.z > 1.25) ||
    (n.type !== 'referente' && cam.z > 0.95);
  if (!show) return;

  let a = 255;
  if (dim) a = 50;
  else if (!focused && n.type !== 'netiana' && age < 90 && cam.z <= 0.95) a = 255 * (1 - age / 90);

  const r = radius(n);
  const sz = (n.type === 'netiana' ? 13 : 10.5) / Math.pow(cam.z, 0.6);
  textSize(sz);
  textAlign(CENTER, TOP);
  noStroke();
  let lbl = n.label;
  if (n.type === 'concepto') lbl = '#' + lbl;
  if (n.type === 'categoria') lbl = '(' + lbl + ')';
  const col = color(n.type === 'netiana' ? COL.white : TIPOS[n.type].color);
  col.setAlpha(a);
  // fondo para leer sobre las líneas
  fill(5, 5, 5, a * 0.7);
  const w = textWidth(lbl);
  rect(n.x - w / 2 - 2, n.y + r + 4, w + 4, sz + 2);
  fill(col);
  text(lbl, n.x, n.y + r + 4);
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
    if (!isShown(n)) return;
    const d = Math.hypot(n.x - w.x, n.y - w.y);
    const hit = radius(n) + 8 / cam.z;
    if (d < hit && d < bd) { best = n; bd = d; }
  });
  return best;
}

function bindPointer(el) {
  el.addEventListener('pointerdown', e => {
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
        calor = Math.max(calor, 0.3);
      } else if (panning) {
        cam.x = downAt.cx - (e.clientX - downAt.x) / cam.z;
        cam.y = downAt.cy - (e.clientY - downAt.y) / cam.z;
      }
      return;
    }
    if (e.pointerType === 'mouse') {
      const n = nodeAt(e.clientX, e.clientY);
      hover = n;
      el.style.cursor = n ? 'pointer' : 'crosshair';
      showTooltip(n, e.clientX, e.clientY);
    }
  });

  const up = e => {
    pointers.delete(e.pointerId);
    if (pinchStart) { if (pointers.size < 2) pinchStart = null; downAt = null; return; }
    if (downAt && moved < 6) {
      const n = nodeAt(e.clientX, e.clientY);
      if (n) elegir(n);
    }
    dragging = null; panning = false; downAt = null;
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', () => { if (!downAt) { hover = null; showTooltip(null); } });

  el.addEventListener('wheel', e => {
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
  let s = `<span style="color:${TIPOS[n.type].color}">${TIPOS[n.type].nombre}</span> · ${n.label}`;
  if (n.type === 'netiana') s = `<span style="color:${COL.green}">(${n.letra})</span> ${n.label} · ${n.data.n}`;
  if (h) s += `<br><span style="color:${COL.mag}">+${h} por descubrir</span>`;
  if (n.grupos.length) s += `<br><span style="color:${COL.gd}">${n.grupos.join(' · ')}</span>`;
  tt.innerHTML = s;
  tt.hidden = false;
  tt.style.left = Math.min(x + 14, window.innerWidth - 270) + 'px';
  tt.style.top = (y + 14) + 'px';
}

/* ── SELECCIÓN: navegar es devenir ───────────── */
function elegir(n) {
  if (!n.visible) reveal(n, selected || { x: cam.x, y: cam.y });
  // un concepto apagado por filtro se vuelve a encender si lo elegís
  if (n.type !== 'netiana' && !filtros[n.type]) toggleFiltro(n.type, true);
  selected = n;
  revealNeighbors(n);
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
    // conexiones con otras netianas por conceptos compartidos
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
      <div class="p-sec">// CONCEPTOS · ${d.t.length}</div>
      <div class="p-tags">${nbrsOfType(n, 'concepto').map(t => btnNode(t, '', '#' + esc(t.label))).join('')}</div>
      <div class="p-sec">// REFERENTES · ${nbrsOfType(n, 'referente').length}</div>
      <div class="p-list">${nbrsOfType(n, 'referente').map(itemRef).join('')}</div>
      <div class="p-sec">// SE CRUZA CON</div>
      <div class="p-list">${conns.map(([id, ts]) => {
        const o = byId[id];
        return `<button class="p-item n" data-node="${esc(id)}"><span class="l">${o.letra}</span><div><div class="t">${esc(o.label)}</div><div class="s">vía ${esc(ts.slice(0, 3).join(', '))}${ts.length > 3 ? '…' : ''}</div></div></button>`;
      }).join('')}</div>`;
  }

  if (n.type === 'concepto') {
    const nets = nbrsOfType(n, 'netiana');
    path.innerHTML = `netianas.net / conceptos / <span>#${esc(n.label)}</span>`;
    h = `<div class="p-kind">concepto</div>
      <div class="p-name" style="color:${COL.mag}">#${esc(n.label)}</div>
      <div class="p-desc">${nets.length} netiana${nets.length !== 1 ? 's' : ''} atravesada${nets.length !== 1 ? 's' : ''} por este concepto.</div>
      ${n.grupos.length ? `<div class="p-meta">grupo: ${esc(n.grupos.join(' · '))}</div>` : ''}
      <div class="p-list">${nets.map(itemNet).join('')}</div>`;
  }

  if (n.type === 'referente') {
    const r = n.ref;
    const nets = nbrsOfType(n, 'netiana');
    const cats = nbrsOfType(n, 'categoria');
    path.innerHTML = `netianas.net / referentes / <span>${esc(n.label.toLowerCase())}</span>`;
    h = `<div class="p-kind">referente</div>
      <div class="p-name" style="color:${COL.cyan}">${esc(r.title)}</div>
      <div class="p-meta">${esc([n.pais, n.anio].filter(Boolean).join(' · '))}</div>
      ${r.img ? `<img class="p-img" src="${IMG_BASE + r.img}" alt="${esc(r.title)}" loading="lazy" onerror="this.remove()">` : ''}
      <div class="p-body">${r.body}</div>
      <div class="p-sec">// CATEGORÍAS</div>
      <div class="p-tags">${cats.map(c => btnNode(c, 'cat', '(' + esc(c.label) + ')')).join('')}</div>
      <div class="p-sec">// ENCARNA ${nets.length > 1 ? 'A LAS NETIANAS' : 'A LA NETIANA'}</div>
      <div class="p-list">${nets.map(itemNet).join('')}</div>`;
  }

  if (n.type === 'categoria') {
    const refs = nbrsOfType(n, 'referente');
    path.innerHTML = `netianas.net / categorías / <span>(${esc(n.label)})</span>`;
    h = `<div class="p-kind">categoría</div>
      <div class="p-name">(${esc(n.label)})</div>
      <div class="p-desc">${refs.length} referente${refs.length !== 1 ? 's' : ''} con esta etiqueta.</div>
      <div class="p-list">${refs.map(itemRef).join('')}</div>`;
  }

  body.innerHTML = h;
  body.scrollTop = 0;
  p.hidden = false;
  document.body.classList.add('panel-open');
}

function closePanel() {
  document.getElementById('panel').hidden = true;
  document.body.classList.remove('panel-open');
  selected = null;
}

/* ── HUD ─────────────────────────────────────── */
function buildHud() {
  const g = document.getElementById('grupos');
  g.innerHTML = Object.entries(GRUPOS).map(([k, v]) =>
    `<button class="chip${k === 'ninguna' ? ' on' : ''}" data-grupo="${k}">${v.nombre}</button>`).join('');
  g.addEventListener('click', e => {
    const b = e.target.closest('[data-grupo]'); if (!b) return;
    g.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b));
    asignarGrupos(b.dataset.grupo);
    setTimeout(() => fit(false), 1800);
  });

  document.querySelectorAll('[data-filtro]').forEach(b =>
    b.addEventListener('click', () => toggleFiltro(b.dataset.filtro)));

  document.getElementById('hud-toggle').addEventListener('click', () => {
    const h = document.getElementById('hud');
    const open = h.classList.toggle('open');
    document.getElementById('hud-toggle').setAttribute('aria-expanded', open);
  });
  document.getElementById('btn-todo').addEventListener('click', desplegarTodo);
  document.getElementById('btn-reset').addEventListener('click', resetGraph);
  document.getElementById('btn-centrar').addEventListener('click', () => fit(false));
  document.getElementById('pn-close').addEventListener('click', closePanel);
  document.getElementById('pn-body').addEventListener('click', e => {
    const b = e.target.closest('[data-node]');
    if (b && byId[b.dataset.node]) elegir(byId[b.dataset.node]);
  });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });
}

function toggleFiltro(tipo, force) {
  filtros[tipo] = force === undefined ? !filtros[tipo] : force;
  document.querySelector(`[data-filtro="${tipo}"]`).classList.toggle('on', filtros[tipo]);
  calor = Math.max(calor, 0.6);
}

function desplegarTodo() {
  // se despliega por oleadas, como una red que crece
  let ola = 0;
  const tick = () => {
    const frontera = NODES.filter(n => n.visible && hiddenCount(n) > 0);
    if (!frontera.length || ola > 6) { setTimeout(() => fit(false), 600); return; }
    frontera.forEach(n => n.nbr.forEach(m => reveal(m, n)));
    calor = 1; ola++;
    setTimeout(tick, 450);
  };
  tick();
}

let lastCount = -1;
function updateContador(c) {
  if (c === lastCount) return;
  lastCount = c;
  const total = NODES.filter(n => n.type === 'netiana' || filtros[n.type]).length;
  document.getElementById('contador').innerHTML =
    `nodos descubiertos <b>${c}</b> / ${total}${c >= total ? ' · <span style="color:#ff00ff">el rizoma nunca se cierra: proponé el tuyo</span>' : ''}`;
}
