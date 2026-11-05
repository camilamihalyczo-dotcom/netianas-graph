/* ══════════════════════════════════════
   NODOS (agrupaciones)
   No hay menú de agrupaciones: los grupos surgen navegando.
   Al tocar una categoría (región, medio, tipo…) o un concepto,
   sus elementos se juntan y se abre su NODO.
   Editá acá los colores y qué entra en cada teoría.
══════════════════════════════════════ */

const PALETA = ['#00ff41', '#ff00ff', '#00ffff', '#ffff00', '#ff6a00', '#b98bff', '#ff4f7b'];

const CONSTELACIONES = {
  // color del nodo de cada categoría (las que no estén acá usan blanco)
  colores: {
    'latinoamericana': '#00ff41',
    'africana':        '#ffff00',
    'asiática':        '#ff00ff',
    'europea':         '#00ffff',
    'anglosajona':     '#ff6a00',
    'net.art':         '#00ff41',
    'video':           '#00ffff',
    'performance':     '#ff00ff',
    'manifiesto':      '#ffff00',
    'colectivo':       '#ff00ff',
    'genealogía net.art': '#b98bff'
  },

  // Al tocar el concepto con el nombre de la teoría (#Haraway, #Butler…)
  // se abre un nodo más grande: las netianas que la tienen como tag,
  // las letras de "netianas" y los conceptos listados.
  // Braidotti no es un tag: su nodo aparece al tocar #posthumano o #devenir.
  teorias: {
    'Haraway':   { color: '#00ff41', conceptos: ['Haraway', 'cyborg', 'posthumano', 'cuerpo-máquina'] },
    'Butler':    { color: '#ff00ff', conceptos: ['Butler', 'performatividad', 'queer', 'desidentificación', 'teatralidad digital'] },
    'Deleuze':   { color: '#00ffff', conceptos: ['Deleuze', 'rizoma', 'líneas de fuga', 'multiplicidad', 'devenir-animal'] },
    'Braidotti': { color: '#ffff00', conceptos: ['posthumano', 'devenir'], netianas: ['N'], disparadores: ['posthumano', 'devenir'] },
    'Borges':    { color: '#ff6a00', conceptos: ['Borges', 'etcétera', 'metaficción'] },
    'Kristeva':  { color: '#b98bff', conceptos: ['Kristeva', 'jardín secreto'] }
  }
};
