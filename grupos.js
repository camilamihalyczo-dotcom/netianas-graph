/* ══════════════════════════════════════
   AGRUPACIONES
   Editá acá cómo se arman los grupos del grafo.
   Un nodo puede estar en varios grupos a la vez:
   las categorías se superponen, no se excluyen.
══════════════════════════════════════ */

const PALETA = ['#00ff41', '#ff00ff', '#00ffff', '#ffff00', '#ff6a00', '#b98bff', '#ff4f7b'];

const GRUPOS = {
  ninguna: { nombre: 'sin agrupar' },

  region: {
    nombre: 'región',
    // tag del referente → nombre del grupo
    tags: {
      'latinoamericana': 'Latinoamérica',
      'africana':        'África',
      'asiática':        'Asia',
      'europea':         'Europa',
      'anglosajona':     'Anglosajona'
    },
    colores: {
      'Latinoamérica': '#00ff41',
      'África':        '#ffff00',
      'Asia':          '#ff00ff',
      'Europa':        '#00ffff',
      'Anglosajona':   '#ff6a00'
    }
  },

  tipo: {
    nombre: 'tipo',
    // 'colectivo' si tiene el tag (colectivo); si no, 'individual'
    colores: { 'Colectivos': '#ff00ff', 'Individuales': '#00ffff' }
  },

  medio: {
    nombre: 'medio',
    tags: {
      'net.art':     'net.art',
      'video':       'video',
      'performance': 'performance',
      'manifiesto':  'manifiesto'
    },
    colores: { 'net.art': '#00ff41', 'video': '#00ffff', 'performance': '#ff00ff', 'manifiesto': '#ffff00' }
  },

  teoria: {
    nombre: 'teoría',
    // una netiana entra en la teoría si tiene el nombre como tag,
    // o si su letra está en "netianas". Los conceptos listados también entran.
    teorias: {
      'Haraway':   { conceptos: ['Haraway', 'cyborg', 'posthumano', 'cuerpo-máquina'] },
      'Butler':    { conceptos: ['Butler', 'performatividad', 'queer', 'desidentificación', 'teatralidad digital'] },
      'Deleuze':   { conceptos: ['Deleuze', 'rizoma', 'líneas de fuga', 'multiplicidad', 'devenir-animal'] },
      'Braidotti': { conceptos: ['posthumano', 'devenir'], netianas: ['N'] },
      'Borges':    { conceptos: ['Borges', 'etcétera', 'metaficción'] },
      'Kristeva':  { conceptos: ['Kristeva', 'jardín secreto'] }
    },
    colores: {
      'Haraway': '#00ff41', 'Butler': '#ff00ff', 'Deleuze': '#00ffff',
      'Braidotti': '#ffff00', 'Borges': '#ff6a00', 'Kristeva': '#b98bff'
    }
  }
};
