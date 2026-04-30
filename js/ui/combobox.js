// Combobox de búsqueda de código BOE.
// Exporta bindCombobox (para wiring en app.js) y descCodigo/notaHistorica
// (usadas también en poblarSelectores).

import { el }            from '../utils.js';
import { AREAS, CODIGOS } from '../tablas.js';

const _norm = s => s.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function _filtrarCodigos(q) {
  if (!q) return CODIGOS;
  const u = _norm(q);
  return CODIGOS.filter(c => _norm(c.codigo).includes(u) || _norm(descCodigo(c)).includes(u));
}

export function descCodigo(c) {
  const areaObj  = AREAS.find(a => a.id === c.area);
  const areaNom  = areaObj?.label.split('—')[1]?.trim() ?? areaObj?.label ?? c.area;
  const m        = c.codigo.match(/^A\dG([A-E])N(\d)$/);
  const grupoNiv = m ? ` · Grupo ${m[1]} · Nivel ${m[2]}` : '';
  return areaNom + grupoNiv;
}

export function notaHistorica(area) {
  if (area === 'estudios-mercado') return ' · Denominada Área 5 en el XVIII Convenio';
  return '';
}

function _renderLista(listaEl, matches, onSelect) {
  listaEl.innerHTML = '';
  if (!matches.length) { listaEl.hidden = true; return; }
  matches.forEach(c => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="cb-codigo">${c.codigo}</span><span class="cb-area">${descCodigo(c)}</span>`;
    li.addEventListener('mousedown', e => { e.preventDefault(); onSelect(c); });
    listaEl.appendChild(li);
  });
  listaEl.hidden = false;
}

export function bindCombobox(inputId, listaId, onSelect, clearBtnId) {
  const input    = el(inputId);
  const lista    = el(listaId);
  const clearBtn = clearBtnId ? el(clearBtnId) : null;
  lista.hidden   = true;

  const pick = c => {
    input.value  = c.codigo;
    lista.hidden = true;
    if (clearBtn) clearBtn.hidden = false;
    onSelect(c);
  };

  input.addEventListener('input', () => {
    _renderLista(lista, _filtrarCodigos(input.value), pick);
    if (clearBtn) clearBtn.hidden = !input.value;
  });
  input.addEventListener('focus', () => _renderLista(lista, _filtrarCodigos(input.value), pick));
  input.addEventListener('blur',  () => setTimeout(() => { lista.hidden = true; }, 150));

  if (clearBtn) {
    clearBtn.addEventListener('mousedown', e => {
      e.preventDefault();
      input.value     = '';
      clearBtn.hidden = true;
      _renderLista(lista, CODIGOS, pick);
      input.focus();
    });
  }
}
