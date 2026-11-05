/* ══════════════════════════════════════
   SONIDO · la red suena
   Todo se genera con Web Audio: no hay archivos de audio.
   El sonido sale de la máquina misma: bips, módem, ruido, latido.
   Los navegadores no dejan sonar nada hasta el primer toque:
   la obra empieza a sonar con el primer clic.
   Editá VOLUMEN y los timbres acá.
══════════════════════════════════════ */

const Sonido = (() => {
  const VOLUMEN = 0.7;          // volumen general (0 a 1)
  const VOL_AMBIENTE = 0.07;    // zumbido de fondo
  const VOL_DATOS = 0.09;       // bips de los datos que viajan
  const VOL_TECLAS = 0.06;     // tecleo de las palabras

  let ctx = null, master = null, ruido = null;
  const ultimo = {};            // para no saturar: límite de sonidos por segundo
  const libre = (k, ms) => {
    const t = performance.now();
    if (ultimo[k] && t - ultimo[k] < ms) return false;
    ultimo[k] = t;
    return true;
  };

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 6;
    master = ctx.createGain();
    master.gain.value = VOLUMEN;
    master.connect(comp); comp.connect(ctx.destination);

    // ruido blanco reutilizable
    ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = ruido.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    ambiente();
    modem(2.2);   // la conexión: mientras suena, la red nace
  }

  const ahora = () => ctx.currentTime;

  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  function osc(tipo, f, t, dur, peak, dest, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    env(g, t, 0.004, peak, dur);
    o.connect(g); g.connect(dest || master);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }

  function soplo(t, dur, peak, f, q, tipo) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = ruido;
    s.playbackRate.value = 0.5 + Math.random();
    fl.type = tipo || 'bandpass'; fl.frequency.value = f; fl.Q.value = q || 1;
    env(g, t, 0.003, peak, dur);
    s.connect(fl); fl.connect(g); g.connect(master);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  // zumbido de fondo: la red encendida, como un transformador
  function ambiente() {
    const fl = ctx.createBiquadFilter(), g = ctx.createGain();
    fl.type = 'lowpass'; fl.frequency.value = 220; fl.Q.value = 4;
    g.gain.value = VOL_AMBIENTE;
    [50, 50.3, 100.4].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 2 ? 'square' : 'sawtooth';
      o.frequency.value = f;
      const og = ctx.createGain(); og.gain.value = i === 2 ? 0.25 : 0.6;
      o.connect(og); og.connect(fl); o.start();
    });
    // el filtro respira despacio
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 0.07; lg.gain.value = 120;
    lfo.connect(lg); lg.connect(fl.frequency); lfo.start();
    fl.connect(g); g.connect(master);
  }

  // tocar un nodo: cada tipo suena distinto
  function toque(tipo) {
    if (!ctx) return;
    const t = ahora();
    if (tipo === 'netiana') {
      // bip metálico con modulación en anillo
      const o = osc('square', 220, t, 0.35, 0.38, null, 180);
      const ring = ctx.createOscillator(), rg = ctx.createGain();
      ring.frequency.value = 311; rg.gain.value = 140;
      ring.connect(rg); rg.connect(o.frequency); ring.start(t); ring.stop(t + 0.4);
      osc('sine', 880, t + 0.05, 0.25, 0.16);
      soplo(t, 0.08, 0.3, 3000, 2);
    } else if (tipo === 'concepto') {
      osc('square', 1320, t, 0.08, 0.2); osc('square', 1760, t + 0.06, 0.1, 0.16);
    } else if (tipo === 'referente') {
      // un bit: dos tonos de módem
      osc('square', Math.random() < .5 ? 1200 : 2200, t, 0.06, 0.18);
      osc('square', Math.random() < .5 ? 1200 : 2200, t + 0.07, 0.06, 0.16);
    } else if (tipo === 'categoria') {
      [440, 554, 659].forEach((f, i) => osc('triangle', f, t + i * 0.04, 0.3, 0.16));
    } else if (tipo === 'palabra') {
      tecla(true); osc('sine', 660, t + 0.02, 0.2, 0.06, null, 990);
    } else if (tipo === 'proponer') {
      modem(1.4);
    }
    // la onda: un barrido que baja
    osc('sawtooth', 900, t + 0.02, 0.5, 0.1, null, 60);
  }

  // un dato llega a un nodo
  function dato(rapido) {
    if (!ctx || !libre('dato', rapido ? 35 : 140)) return;
    const notas = [523, 659, 784, 988, 1175, 1568, 2093];
    const f = notas[Math.floor(Math.random() * notas.length)] * (rapido ? 1 : 0.5);
    osc(rapido ? 'square' : 'sine', f, ahora(), rapido ? 0.05 : 0.09, rapido ? VOL_DATOS * 1.6 : VOL_DATOS);
  }

  // latido: lub-dub grave
  function latido() {
    if (!ctx || !libre('latido', 250)) return;
    const t = ahora();
    osc('sine', 70, t, 0.22, 0.4, null, 38);
    osc('sine', 62, t + 0.17, 0.2, 0.26, null, 34);
    soplo(t, 0.05, 0.06, 180, 1, 'lowpass');
  }

  // ruido digital del glitch
  function glitch(fuerza) {
    if (!ctx || !libre('glitch', fuerza > 0.5 ? 90 : 400)) return;
    const t = ahora();
    const n = fuerza > 0.5 ? 4 : 1;
    for (let i = 0; i < n; i++) {
      const tt = t + i * (0.02 + Math.random() * 0.04);
      soplo(tt, 0.03 + Math.random() * 0.06, (fuerza > 0.5 ? 0.35 : 0.1), 400 + Math.random() * 5000, 6);
      if (Math.random() < 0.5) osc('square', 60 + Math.random() * 2000, tt, 0.03, fuerza > 0.5 ? 0.06 : 0.025);
    }
  }

  // tecleo: las palabras se escriben
  function tecla(fuerte) {
    if (!ctx || !libre('tecla', fuerte ? 0 : 45)) return;
    soplo(ahora(), 0.018, fuerte ? VOL_TECLAS * 3 : VOL_TECLAS, 2500 + Math.random() * 3000, 8, 'highpass');
  }

  // pasar por encima de un nodo
  function roce() {
    if (!ctx || !libre('roce', 60)) return;
    osc('sine', 2400 + Math.random() * 600, ahora(), 0.03, 0.03);
  }

  // fijar y soltar un nodo arrastrado
  function anclar() {
    if (!ctx) return;
    const t = ahora();
    osc('square', 110, t, 0.06, 0.15); soplo(t, 0.04, 0.2, 900, 3);
  }
  function soltar() {
    if (!ctx) return;
    osc('sine', 220, ahora(), 0.25, 0.08, null, 660);
  }

  // handshake de módem: el sonido de conectarse a internet
  function modem(dur) {
    if (!ctx) return;
    const t = ahora();
    osc('sine', 1375, t, 0.25, 0.1);
    osc('sine', 2100, t + 0.28, 0.2, 0.1);
    let tt = t + 0.5;
    while (tt < t + dur) {
      const f = [980, 1180, 1650, 1850, 2400][Math.floor(Math.random() * 5)];
      const d = 0.03 + Math.random() * 0.07;
      osc('square', f, tt, d, 0.05);
      if (Math.random() < 0.3) soplo(tt, d, 0.04, 2000, 2);
      tt += d * 0.8;
    }
  }

  return { init, toque, dato, latido, glitch, tecla, roce, anclar, soltar, modem, activo: () => !!ctx };
})();

// el primer toque en cualquier parte enciende el sonido
['pointerdown', 'keydown', 'touchstart'].forEach(ev =>
  window.addEventListener(ev, () => Sonido.init(), { passive: true }));
