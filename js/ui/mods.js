// Gestión de modificaciones salariales.
// agregarMod y eliminarMod solo mutan el estado y devuelven boolean.
// La orquestación (refreshMods + actualizar) la hace app.js.

import { el, fmt, fmtPct, parseSalario } from '../utils.js';
import { AREAS, CODIGOS }                 from '../tablas.js';
import { state }                          from '../state.js';

export function agregarMod() {
  const year = +el('mod-year').value;
  const mes  = +el('mod-mes').value;
  const tipo = el('mod-tipo').value;

  let valor, areamod;
  if (tipo === 'nivel') {
    const entrada = CODIGOS.find(c => c.codigo === el('mod-codigo').value.toUpperCase().trim());
    if (!entrada) return false;
    valor   = entrada.nivel;
    areamod = entrada.area;
  } else {
    valor = parseSalario(el('mod-val-salario').value);
    if (isNaN(valor) || valor <= 0) return false;
  }

  if (year < state.yearInicio) return false;

  const mod = { id: state._nextId++, year, mes, tipo, valor };
  if (tipo === 'nivel') mod.area = areamod;
  state.modificaciones.push(mod);
  return true;
}

export function eliminarMod(id) {
  state.modificaciones = state.modificaciones.filter(m => m.id !== id);
}

// onEliminar(id): callback que app.js pasa para coordinar eliminar + refresh + actualizar
export function renderMods(onEliminar) {
  const lista = el('lista-mods');
  lista.innerHTML = '';

  if (state.modificaciones.length === 0) {
    lista.innerHTML = '<p class="mod-empty">Sin modificaciones añadidas</p>';
    return;
  }

  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  const prevSalMap = new Map();
  let salPrev = state.salarioInicio;
  [...state.modificaciones]
    .filter(m => m.tipo === 'salario')
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.mes - b.mes)
    .forEach(m => { prevSalMap.set(m.id, salPrev); salPrev = m.valor; });

  [...state.modificaciones]
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.mes - b.mes)
    .forEach(m => {
      const div = document.createElement('div');
      div.className = 'mod-tag';
      let desc;
      if (m.tipo === 'nivel') {
        const areaLabel = AREAS.find(a => a.id === m.area)?.label ?? m.area ?? '';
        desc = `Cambio a ${m.valor}` + (m.area ? ` · ${areaLabel.split('—')[0].trim()}` : '');
      } else {
        const anterior = prevSalMap.get(m.id);
        const pct      = anterior ? (m.valor - anterior) / anterior : 0;
        desc = `Salario → ${fmt(m.valor)} €` +
          (pct !== 0 ? ` <b>(${pct > 0 ? '+' : ''}${fmtPct(pct)})</b>` : '');
      }
      div.innerHTML = `
        <span class="mod-fecha">${MESES[m.mes - 1]} ${m.year}</span>
        <span class="mod-desc">${desc}</span>
        <button class="mod-del" data-id="${m.id}" title="Eliminar">✕</button>
      `;
      lista.appendChild(div);
    });

  lista.querySelectorAll('.mod-del').forEach(btn => {
    btn.addEventListener('click', e => onEliminar(+e.currentTarget.dataset.id));
  });
}
