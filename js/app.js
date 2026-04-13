/**
 * app.js — Lógica de interfaz
 *
 * Responsabilidades:
 *   - Mantener el estado de la aplicación
 *   - Escuchar eventos del usuario
 *   - Llamar a las funciones de data.js
 *   - Renderizar KPIs, gráfico canvas y tabla
 *
 * No contiene ningún dato del convenio ni cálculo de negocio.
 * Todo eso vive en data.js.
 */

import {
  AREAS,
  CODIGOS,
  YEARS,
  INCREMENTOS,
  generarSerie,
  getTablaSalarial,
  calcularAcumulados,
} from './data.js';

// ---------------------------------------------------------------------------
// ESTADO
// ---------------------------------------------------------------------------

let _serie    = [];
let _serieMap = new Map();
let _rango    = { min: 0, max: 0 };

const state = {
  yearInicio:     2022,
  yearFin:        2026,
  area:           'programacion',
  nivelInicio:    'C-2',
  salarioInicio:  32_000,
  fechaAlta:      '2019-01',
  modificaciones: [],
  _nextId:        1,
};

// ---------------------------------------------------------------------------
// UTILIDADES DOM
// ---------------------------------------------------------------------------
const el = id => document.getElementById(id);

function crearOption(value, text) {
  const o = document.createElement('option');
  o.value = value;
  o.textContent = text;
  return o;
}


// ---------------------------------------------------------------------------
// FORMATO DE NÚMEROS
// ---------------------------------------------------------------------------
const fmt = n =>
  n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtK = n =>
  Math.abs(n) >= 1000
    ? (n / 1000).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' k'
    : fmt(n);

const fmtPct = v =>
  (v * 100).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';

// Parseo y formato para inputs de salario (texto con separador de miles español)
const parseSalario = s => parseFloat(String(s).replace(/\./g, '').replace(',', '.'));
const fmtInput    = n => isNaN(n) || n <= 0 ? '' : n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// ---------------------------------------------------------------------------
// INICIALIZACIÓN
// ---------------------------------------------------------------------------
export function init() {
  leerDesdeURL();
  poblarSelectores();
  bindEventos();
  renderMods();
  validarArea();
  validarSalario();
  actualizar();
}

function poblarSelectores() {
  // Años
  YEARS.forEach(y => {
    el('sel-year').appendChild(crearOption(y, y));
    el('sel-year-fin').appendChild(crearOption(y, y));
    el('mod-year').appendChild(crearOption(y, y));
  });
  el('sel-year').value     = state.yearInicio;
  el('sel-year-fin').value = state.yearFin;
  el('mod-year').value     = 2024;
  el('lbl-year-inicio').textContent = state.yearInicio;

  // Combobox código de convenio — valor inicial
  const codigoInicial = CODIGOS.find(c => c.area === state.area && c.nivel === state.nivelInicio);
  if (codigoInicial) {
    el('inp-codigo').value = codigoInicial.codigo;
    el('inp-codigo-desc').textContent = _descCodigo(codigoInicial) + _notaHistorica(codigoInicial.area);
    el('inp-codigo-clear').hidden = false;
  }

  // Salario
  el('inp-salario').value = fmtInput(state.salarioInicio);

  // Fecha de alta — selects año/mes
  const [altaYearVal, altaMesVal] = state.fechaAlta.split('-');
  for (let y = 1990; y <= 2026; y++) {
    el('alta-year').appendChild(crearOption(y, y));
  }
  el('alta-year').value = altaYearVal;
  el('alta-mes').value  = +altaMesVal;
}

// ---------------------------------------------------------------------------
// COMBOBOX CÓDIGO DE CONVENIO
// ---------------------------------------------------------------------------
const _norm = s => s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function _filtrarCodigos(q) {
  if (!q) return CODIGOS;
  const u = _norm(q);
  return CODIGOS.filter(c => _norm(c.codigo).includes(u) || _norm(_descCodigo(c)).includes(u));
}

function _descCodigo(c) {
  const areaObj  = AREAS.find(a => a.id === c.area);
  const areaNom  = areaObj?.label.split('—')[1]?.trim() ?? areaObj?.label ?? c.area;
  const m        = c.codigo.match(/^A\dG([A-E])N(\d)$/);
  const grupoNiv = m ? ` · Grupo ${m[1]} · Nivel ${m[2]}` : '';
  return areaNom + grupoNiv;
}

function _notaHistorica(area) {
  if (area === 'estudios-mercado') return ' · Denominada Área 5 en el XVIII Convenio';
  return '';
}

function _renderLista(listaEl, matches, onSelect) {
  listaEl.innerHTML = '';
  if (!matches.length) { listaEl.hidden = true; return; }
  matches.forEach(c => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="cb-codigo">${c.codigo}</span><span class="cb-area">${_descCodigo(c)}</span>`;
    li.addEventListener('mousedown', e => { e.preventDefault(); onSelect(c); });
    listaEl.appendChild(li);
  });
  listaEl.hidden = false;
}

function _bindCombobox(inputId, listaId, onSelect, clearBtnId) {
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
  input.addEventListener('focus', () => {
    _renderLista(lista, _filtrarCodigos(input.value), pick);
  });
  input.addEventListener('blur', () => setTimeout(() => { lista.hidden = true; }, 150));

  if (clearBtn) {
    clearBtn.addEventListener('mousedown', e => {
      e.preventDefault();
      input.value       = '';
      clearBtn.hidden   = true;
      _renderLista(lista, CODIGOS, pick);
      input.focus();
    });
  }
}

function bindEventos() {
  // Combobox situación inicial
  _bindCombobox('inp-codigo', 'inp-codigo-lista', c => {
    state.area        = c.area;
    state.nivelInicio = c.nivel;
    el('inp-codigo-desc').textContent = _descCodigo(c) + _notaHistorica(c.area);
    validarArea();
    validarSalario();
    actualizar();
  }, 'inp-codigo-clear');

  // Combobox modificación de nivel
  _bindCombobox('mod-codigo', 'mod-codigo-lista', () => {}, 'mod-codigo-clear');

  el('sel-year').addEventListener('change', e => {
    state.yearInicio = +e.target.value;
    el('lbl-year-inicio').textContent = state.yearInicio;
    if (state.yearFin < state.yearInicio) {
      state.yearFin = state.yearInicio;
      el('sel-year-fin').value = state.yearFin;
    }
    validarArea();
    validarSalario();
    validarFechaAlta();
    actualizar();
  });

  el('sel-year-fin').addEventListener('change', e => {
    state.yearFin = +e.target.value;
    if (state.yearFin < state.yearInicio) {
      state.yearFin = state.yearInicio;
      el('sel-year-fin').value = state.yearFin;
    }
    actualizar();
  });

  el('inp-salario').addEventListener('input', e => {
    const v = parseSalario(e.target.value);
    if (!isNaN(v) && v > 0) {
      state.salarioInicio = v;
      validarSalario();
      actualizar();
    }
  });
  el('inp-salario').addEventListener('blur', e => {
    const v = parseSalario(e.target.value);
    if (!isNaN(v) && v > 0) e.target.value = fmtInput(v);
  });
  el('inp-salario').addEventListener('focus', e => e.target.select());

  const onAltaChange = () => {
    const y = el('alta-year').value;
    const m = String(el('alta-mes').value).padStart(2, '0');
    state.fechaAlta = `${y}-${m}`;
    validarFechaAlta();
    actualizar();
  };
  el('alta-year').addEventListener('change', onAltaChange);
  el('alta-mes').addEventListener('change', onAltaChange);

  document.querySelectorAll('.num-up, .num-down').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = el(btn.dataset.target);
      const v     = parseSalario(input.value) || 0;
      const newV  = Math.max(0, v + (btn.classList.contains('num-up') ? 100 : -100));
      input.value = fmtInput(newV);
      input.dispatchEvent(new Event('input'));
    });
  });

  el('mod-val-salario').addEventListener('blur', e => {
    const v = parseSalario(e.target.value);
    if (!isNaN(v) && v > 0) e.target.value = fmtInput(v);
  });
  el('mod-val-salario').addEventListener('focus', e => e.target.select());

  el('mod-tipo').addEventListener('change', e => {
    const esNivel = e.target.value === 'nivel';
    el('wrap-mod-nivel').style.display   = esNivel ? '' : 'none';
    el('wrap-mod-salario').style.display = esNivel ? 'none' : '';
  });

  el('btn-add-mod').addEventListener('click', agregarMod);

  window.addEventListener('resize', () => {
    if (_serie.length) renderGrafico(_serie);
  });

  el('grafico').addEventListener('mousemove', onGraficoHover);
  el('grafico').addEventListener('mouseleave', () => {
    el('grafico-tooltip').style.display = 'none';
  });

  el('tabla-body').addEventListener('mousemove', onTablaHover);
  el('tabla-body').addEventListener('mouseleave', () => {
    el('tabla-tooltip').style.display = 'none';
  });

  el('btn-compartir').addEventListener('click', () => {
    const btn   = el('btn-compartir');
    const codigo = CODIGOS.find(c => c.area === state.area && c.nivel === state.nivelInicio);
    if (!codigo) return;
    const p = new URLSearchParams({
      yi: state.yearInicio,
      yf: state.yearFin,
      g:  codigo.codigo,
      s:  state.salarioInicio,
      a:  state.fechaAlta,
    });
    const url = location.origin + location.pathname + '?' + p.toString();
    navigator.clipboard.writeText(url).then(() => {
      btn.textContent = '✓ Enlace copiado';
      btn.classList.add('copiado');
      setTimeout(() => {
        btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Copiar enlace';
        btn.classList.remove('copiado');
      }, 2000);
    });
  });

  // Tooltips de cabecera: position:fixed para escapar del overflow-x:auto de .tabla-wrapper
  document.querySelectorAll('.th-help').forEach(helpEl => {
    const popup = helpEl.querySelector('.th-help-popup');
    if (!popup) return;
    helpEl.addEventListener('mouseenter', () => {
      const r   = helpEl.getBoundingClientRect();
      const W   = 400;
      const gap = 6;
      popup.style.top = (r.bottom + gap) + 'px';
      if (popup.classList.contains('th-help-popup--left')) {
        popup.style.left = Math.max(4, r.right - W) + 'px';
      } else if (popup.classList.contains('th-help-popup--right')) {
        popup.style.left = r.left + 'px';
      } else {
        popup.style.left = Math.max(4, r.left + r.width / 2 - W / 2) + 'px';
      }
      popup.style.visibility = 'visible';
    });
    helpEl.addEventListener('mouseleave', () => {
      popup.style.visibility = 'hidden';
    });
  });
}

// ---------------------------------------------------------------------------
// TOOLTIP DEL GRÁFICO
// ---------------------------------------------------------------------------
function onGraficoHover(e) {
  if (_serie.length === 0) return;

  const canvas  = el('grafico');
  const wrapper = canvas.parentElement;
  const rect    = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const mx     = (e.clientX - rect.left) * scaleX;

  const pad = { top: 28, right: 20, bottom: 52, left: 76 };
  const gW  = canvas.width - pad.left - pad.right;
  const xPos = i => pad.left + (_serie.length > 1 ? (i / (_serie.length - 1)) * gW : gW / 2);

  let nearest = 0;
  let minDist  = Infinity;
  _serie.forEach((p, i) => {
    const dx = Math.abs(mx - xPos(i));
    if (dx < minDist) { minDist = dx; nearest = i; }
  });

  const tooltip = el('grafico-tooltip');

  if (minDist / scaleX > 40) {
    tooltip.style.display = 'none';
    return;
  }

  const p = _serie[nearest];

  let html = `<span class="tt-year">${p.year}</span>`;
  if (p.salarioConvenio) {
    html += `<div>Tablas convenio: <b style="color:#6b7280">${fmt(p.salarioConvenio)} €</b></div>`;
  }
  html += `<div>Salario real: <b style="color:var(--azul)">${fmt(p.salarioReal)} €</b></div>`;
  if (p.salarioSinAbsorcion) {
    html += `<div>Sin absorción: <b style="color:var(--amarillo)">${fmt(p.salarioSinAbsorcion)} €</b></div>`;
  }
  if (p.trieniosActuales > 0) {
    html += `<div style="color:var(--gris-5)">Trienios: ${p.trieniosActuales}`;
    if (p.trienioNuevo) {
      html += ` <span class="tt-nuevo">(nuevo +${fmt(p.importeTrienioNuevo)} €)</span>`;
    }
    html += '</div>';
  }
  html += `<div>Equiv. IPC: <b style="color:var(--rojo)">${fmt(p.salarioPoder)} €</b></div>`;

  tooltip.innerHTML = html;
  tooltip.style.display = 'block';

  const wRect = wrapper.getBoundingClientRect();
  let tipX    = e.clientX - wRect.left + 14;
  const tipY  = e.clientY - wRect.top  - 10;

  tooltip.style.left = '-9999px';
  const tipW = tooltip.offsetWidth;
  if (tipX + tipW + 10 > wRect.width) tipX = e.clientX - wRect.left - tipW - 14;
  tooltip.style.left = tipX + 'px';
  tooltip.style.top  = Math.max(0, tipY) + 'px';
}

// ---------------------------------------------------------------------------
// MODIFICACIONES
// ---------------------------------------------------------------------------
function agregarMod() {
  const year = +el('mod-year').value;
  const mes  = +el('mod-mes').value;
  const tipo = el('mod-tipo').value;

  let valor;
  let areamod;
  if (tipo === 'nivel') {
    const entrada = CODIGOS.find(c => c.codigo === el('mod-codigo').value.toUpperCase().trim());
    if (!entrada) return;
    valor   = entrada.nivel;
    areamod = entrada.area;
  } else {
    valor = parseSalario(el('mod-val-salario').value);
    if (isNaN(valor) || valor <= 0) return;
  }

  if (year < state.yearInicio) return;

  const mod = { id: state._nextId++, year, mes, tipo, valor };
  if (tipo === 'nivel') mod.area = areamod;
  state.modificaciones.push(mod);
  renderMods();
  actualizar();
}

function eliminarMod(id) {
  state.modificaciones = state.modificaciones.filter(m => m.id !== id);
  renderMods();
  actualizar();
}

function renderMods() {
  const lista = el('lista-mods');
  lista.innerHTML = '';

  if (state.modificaciones.length === 0) {
    lista.innerHTML = '<p class="mod-empty">Sin modificaciones añadidas</p>';
    return;
  }

  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  // Mapa id → salario previo para calcular % de cambio
  const prevSalMap = new Map();
  let salPrevMods = state.salarioInicio;
  [...state.modificaciones]
    .filter(m => m.tipo === 'salario')
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.mes - b.mes)
    .forEach(m => { prevSalMap.set(m.id, salPrevMods); salPrevMods = m.valor; });

  [...state.modificaciones]
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.mes - b.mes)
    .forEach(m => {
      const div  = document.createElement('div');
      div.className = 'mod-tag';
      let desc;
      if (m.tipo === 'nivel') {
        const areaLabel = AREAS.find(a => a.id === m.area)?.label ?? m.area ?? '';
        const areaCorta = areaLabel.split('—')[0].trim(); // "Área 4"
        desc = `Cambio a ${m.valor}` + (m.area ? ` · ${areaCorta}` : '');
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
    btn.addEventListener('click', e => {
      eliminarMod(+e.currentTarget.dataset.id);
    });
  });
}

// ---------------------------------------------------------------------------
// VALIDACIÓN
// ---------------------------------------------------------------------------
function validarArea() {
  const errorEl = el('error-area');
  if (state.area === 'ciberseguridad' && state.yearInicio < 2025) {
    errorEl.textContent = 'El Área 5 (Ciberseguridad) solo existe desde 2025. Cambia el año de inicio.';
    errorEl.classList.add('visible');
    return false;
  }
  errorEl.classList.remove('visible');
  return true;
}

function validarFechaAlta() {
  const errorEl   = el('error-alta');
  const yearAlta  = parseInt(state.fechaAlta.split('-')[0], 10);
  if (yearAlta > state.yearInicio) {
    errorEl.textContent = `La fecha de alta (${yearAlta}) es posterior al año de inicio del período (${state.yearInicio}). Ajusta el año de inicio o la fecha de alta.`;
    errorEl.classList.add('visible');
    return false;
  }
  errorEl.classList.remove('visible');
  return true;
}

function validarSalario() {
  const tablas  = getTablaSalarial(state.nivelInicio, state.yearInicio, state.area);
  const errorEl = el('error-salario');
  const inputEl = el('inp-salario');

  if (tablas && state.salarioInicio < tablas.total) {
    errorEl.textContent = `El salario introducido (${fmt(state.salarioInicio)} €) está por debajo del mínimo de convenio para este grupo en ${state.yearInicio} (${fmt(tablas.total)} €). Comprueba que has introducido el salario bruto anual y el grupo correcto.`;
    errorEl.classList.add('visible');
    inputEl.classList.add('invalid');
    return false;
  }
  errorEl.classList.remove('visible');
  inputEl.classList.remove('invalid');
  return true;
}

// ---------------------------------------------------------------------------
// URL — compartir configuración
// ---------------------------------------------------------------------------
function leerDesdeURL() {
  if (!location.search) return;
  const p = new URLSearchParams(location.search);

  const yi = parseInt(p.get('yi'), 10);
  if (YEARS.includes(yi)) state.yearInicio = yi;

  const yf = parseInt(p.get('yf'), 10);
  if (YEARS.includes(yf) && yf >= state.yearInicio) state.yearFin = yf;

  const g      = p.get('g')?.toUpperCase().trim();
  const codigo = g ? CODIGOS.find(c => c.codigo === g) : null;
  if (codigo) {
    state.area        = codigo.area;
    state.nivelInicio = codigo.nivel;
  }

  const s = parseFloat(p.get('s'));
  if (!isNaN(s) && s > 0) state.salarioInicio = s;

  const a = p.get('a');
  if (a && /^\d{4}-\d{2}$/.test(a)) {
    const yearAlta = parseInt(a.split('-')[0], 10);
    if (yearAlta >= 1990 && yearAlta <= 2026) state.fechaAlta = a;
  }

  // Limpia la URL tras leer los parámetros
  history.replaceState(null, '', location.pathname);
}

// ---------------------------------------------------------------------------
// CICLO PRINCIPAL
// ---------------------------------------------------------------------------
function actualizar() {
  if (!validarArea()) return;
  if (!validarFechaAlta()) return;
  if (!validarSalario()) return;
  const serie = generarSerie(state);
  if (serie.length === 0) return;
  renderKPIs(serie);
  renderGrafico(serie);
  renderTabla(serie);
}

// ---------------------------------------------------------------------------
// KPIs
// ---------------------------------------------------------------------------
function renderKPIs(serie) {
  const ultimo = serie[serie.length - 1];

  el('kpi-salario-actual').textContent = fmt(ultimo.salarioReal) + ' €';

  el('kpi-sin-absorcion').textContent = ultimo.salarioSinAbsorcion
    ? fmt(ultimo.salarioSinAbsorcion) + ' €'
    : '—';

  const acum = calcularAcumulados(serie);
  el('kpi-perdida-absorcion').textContent = acum.perdidaAbsorcion > 0
    ? '−' + fmt(acum.perdidaAbsorcion) + ' €'
    : '—';

  el('kpi-poder-ipc').textContent = fmt(ultimo.salarioPoder) + ' €';

  el('kpi-perdida-poder').textContent = acum.perdidaPoder > 0
    ? '−' + fmt(acum.perdidaPoder) + ' €'
    : '—';
}

// ---------------------------------------------------------------------------
// GRÁFICO — canvas 2D nativo
// ---------------------------------------------------------------------------
const COLORES = {
  real:         '#1a7a8a',
  sinAbsorcion: '#9e6c00',
  convenio:     '#6b7280',
  poder:        '#c0392b',
  grid:         '#d8d4cc',
  texto:        '#777',
  fondo:        '#f5f4f0',
};

function renderGrafico(serie) {
  const canvas = el('grafico');
  const ctx    = canvas.getContext('2d');

  canvas.width  = canvas.parentElement.clientWidth || 800;
  canvas.height = 360;

  const W   = canvas.width;
  const H   = canvas.height;
  const pad = { top: 28, right: 20, bottom: 52, left: 76 };
  const gW  = W - pad.left - pad.right;
  const gH  = H - pad.top  - pad.bottom;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORES.fondo;
  ctx.fillRect(0, 0, W, H);

  if (serie.length === 0) return;

  _serie = serie;

  const vals = serie.flatMap(p => [
    p.salarioReal,
    p.salarioConvenio     ?? 0,
    p.salarioSinAbsorcion ?? 0,
    p.salarioPoder,
  ]).filter(v => v > 0);

  const minVal = Math.min(...vals) * 0.94;
  const maxVal = Math.max(...vals) * 1.06;

  _rango = { min: minVal, max: maxVal };

  const xPos = i  => pad.left + (serie.length > 1 ? (i / (serie.length - 1)) * gW : gW / 2);
  const yPos = v  => pad.top  + gH - ((v - minVal) / (maxVal - minVal)) * gH;

  const nLineas = 5;
  ctx.strokeStyle = COLORES.grid;
  ctx.lineWidth   = 1;
  ctx.setLineDash([4, 4]);
  ctx.font        = '11px "IBM Plex Mono","Courier New",monospace';

  for (let i = 0; i <= nLineas; i++) {
    const v = minVal + (maxVal - minVal) * (i / nLineas);
    const y = yPos(v);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + gW, y);
    ctx.stroke();
    ctx.fillStyle = COLORES.texto;
    ctx.textAlign = 'right';
    ctx.fillText(fmtK(v) + ' €', pad.left - 8, y + 4);
  }
  ctx.setLineDash([]);

  ctx.fillStyle = COLORES.texto;
  ctx.textAlign = 'center';
  serie.forEach((p, i) => {
    const x = xPos(i);
    ctx.fillText(p.year, x, H - pad.bottom + 18);
    if (p.ipc?.prevision) {
      ctx.fillStyle = '#aaa';
      ctx.fillText('~', x, H - pad.bottom + 32);
      ctx.fillStyle = COLORES.texto;
    }
  });

  function dibujarLinea(getter, color, dash = []) {
    const pts = serie
      .map((p, i) => {
        const v = getter(p);
        return (v !== null && v > 0) ? { x: xPos(i), y: yPos(v) } : null;
      })
      .filter(Boolean);

    if (pts.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth   = 2.5;
    ctx.setLineDash(dash);
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo : ctx.lineTo).call(ctx, p.x, p.y));
    ctx.stroke();
    ctx.setLineDash([]);

    pts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  // Área sombreada entre salario real y equivalente IPC
  const ptsReal  = serie.map((p, i) => ({ x: xPos(i), y: yPos(p.salarioReal) }));
  const ptsPoder = serie.map((p, i) => ({ x: xPos(i), y: yPos(p.salarioPoder) }));
  if (ptsReal.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(ptsPoder[0].x, ptsPoder[0].y);
    ptsPoder.forEach(pt => ctx.lineTo(pt.x, pt.y));
    for (let i = ptsReal.length - 1; i >= 0; i--) ctx.lineTo(ptsReal[i].x, ptsReal[i].y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(192, 57, 43, 0.10)';
    ctx.fill();
  }

  dibujarLinea(p => p.salarioPoder,        COLORES.poder,        []);
  dibujarLinea(p => p.salarioConvenio,     COLORES.convenio,     []);
  dibujarLinea(p => p.salarioSinAbsorcion, COLORES.sinAbsorcion, []);
  dibujarLinea(p => p.salarioReal,         COLORES.real,         []);

  serie.forEach((p, i) => {
    if (!p.trienioNuevo || !p.salarioSinAbsorcion) return;
    const x = xPos(i);
    const y = yPos(p.salarioSinAbsorcion);
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = COLORES.sinAbsorcion;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = COLORES.fondo;
    ctx.fill();
  });

  const leyenda = [
    { color: COLORES.convenio,     label: 'Convenio' },
    { color: COLORES.real,         label: 'Salario real'    },
    { color: COLORES.sinAbsorcion, label: 'Sin absorción *'  },
    { color: COLORES.poder,        label: 'Equiv. IPC'      },
  ];

  ctx.font = '10px "IBM Plex Mono","Courier New",monospace';
  let lx = pad.left;
  const ly = H - 8;

  leyenda.forEach(l => {
    ctx.strokeStyle = l.color;
    ctx.lineWidth   = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + 22, ly);
    ctx.stroke();
    ctx.fillStyle = '#777';
    ctx.textAlign = 'left';
    ctx.fillText(l.label, lx + 26, ly + 4);
    lx += ctx.measureText(l.label).width + 52;
  });
}

// ---------------------------------------------------------------------------
// TABLA DETALLE
// ---------------------------------------------------------------------------
function renderTabla(serie) {
  const tbody = el('tabla-body');
  tbody.innerHTML = '';
  _serieMap.clear();

  // Mapa year → salario previo para las modificaciones salariales
  const salModMap = new Map();
  let salPrevTabla = state.salarioInicio;
  [...state.modificaciones]
    .filter(m => m.tipo === 'salario')
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.mes - b.mes)
    .forEach(m => { salModMap.set(m.year, salPrevTabla); salPrevTabla = m.valor; });

  serie.forEach(p => {
    _serieMap.set(p.year, p);

    const tr = document.createElement('tr');

    const ipcTxt = p.ipc
      ? fmtPct(p.ipc.valor) + (p.ipc.prevision ? '<span class="badge-prev">~</span>' : '')
      : '—';

    const trienioTxt = p.trienioNuevo
      ? `<span class="trienio-nuevo">${p.trieniosActuales} · ${fmt(p.desglose.antig)} € (+${fmt(p.importeTrienioNuevo)} €)</span>`
      : p.trieniosActuales > 0 && p.desglose?.antig
        ? `<span style="color:var(--amarillo)">${p.trieniosActuales} · ${fmt(p.desglose.antig)} €</span>`
        : '—';

    const codigo = CODIGOS.find(c => c.area === p.areaEfectiva && c.nivel === p.nivelEfectivo)?.codigo
      ?? p.nivelEfectivo;

    tr.innerHTML = `
      <td>${p.year}</td>
      <td class="nivel">${codigo}${p.e2Promovido ? ' <span class="badge-e2" title="Promoción automática E-2 → E-1 (art. XVIII Convenio)">↑E-1</span>' : ''}</td>
      <td class="teo">${p.salarioConvenio
        ? fmt(p.salarioConvenio) + ' €' + (INCREMENTOS[p.year] != null
          ? ` <b>(+${fmtPct(INCREMENTOS[p.year])})</b>`
          : '')
        : '—'}</td>
      <td class="val-real">${fmt(p.salarioReal)} €${salModMap.has(p.year) ? ` <b>(+${fmtPct((p.salarioReal - salModMap.get(p.year)) / salModMap.get(p.year))})</b>` : ''}</td>
      <td class="sinabs">${p.salarioSinAbsorcion ? fmt(p.salarioSinAbsorcion) + ' €' : '—'}</td>
      <td class="trienio">${trienioTxt}</td>
      <td class="${p.perdidaAbsorcion > 0 ? 'sinabs' : ''}">${p.perdidaAbsorcion > 0 ? '-' + fmt(p.perdidaAbsorcion) + ' €' : '—'}</td>
      <td class="val-ipc">${fmt(p.salarioPoder)} €</td>
      <td class="${p.perdidaPoder > 0 ? 'neg' : ''}">${p.perdidaPoder > 0 ? '-' + fmt(p.perdidaPoder) + ' €' : '—'}</td>
      <td class="ipc">${ipcTxt}</td>
    `;

    tbody.appendChild(tr);
  });

  // Fila de totales en tfoot
  const acum = calcularAcumulados(serie);
  let factorIpc = 1;
  let tienePrevision = false;
  serie.forEach(p => {
    if (p.ipc) {
      factorIpc *= (1 + p.ipc.valor);
      if (p.ipc.prevision) tienePrevision = true;
    }
  });

  const tfoot = el('tabla-foot');
  const trTot = document.createElement('tr');
  trTot.innerHTML = `
    <td class="total-label">Total</td>
    <td>—</td>
    <td>—</td>
    <td>—</td>
    <td>—</td>
    <td>—</td>
    <td class="sinabs">${acum.perdidaAbsorcion > 0 ? '−' + fmt(acum.perdidaAbsorcion) + ' €' : '—'}</td>
    <td>—</td>
    <td class="${acum.perdidaPoder > 0 ? 'neg' : ''}">${acum.perdidaPoder > 0 ? '−' + fmt(acum.perdidaPoder) + ' €' : '—'}</td>
    <td class="ipc">${(tienePrevision ? '~' : '') + '+' + fmtPct(factorIpc - 1)}</td>
  `;
  tfoot.innerHTML = '';
  tfoot.appendChild(trTot);
}

// ---------------------------------------------------------------------------
// TOOLTIP DE TABLA — por columna
// ---------------------------------------------------------------------------
function onTablaHover(e) {
  const td      = e.target.closest('td');
  const tooltip = el('tabla-tooltip');

  if (!td) { tooltip.style.display = 'none'; return; }

  const tr = td.closest('tr');
  if (!tr) { tooltip.style.display = 'none'; return; }

  const colIdx = Array.from(tr.children).indexOf(td);
  const year   = parseInt(tr.firstElementChild.textContent, 10);
  const p      = _serieMap.get(year);
  if (!p) { tooltip.style.display = 'none'; return; }

  const html = buildTablaTooltip(colIdx, p);
  if (!html) { tooltip.style.display = 'none'; return; }

  tooltip.innerHTML    = html;
  tooltip.style.left   = '-9999px';
  tooltip.style.top    = '0px';
  tooltip.style.display = 'block';

  const tipW  = tooltip.offsetWidth;
  const tipH  = tooltip.offsetHeight;
  const rawX  = e.clientX + 14;
  const rawY  = e.clientY - 10;
  const finalX = rawX + tipW + 10 > window.innerWidth  ? e.clientX - tipW - 14 : rawX;
  const finalY = Math.max(0, Math.min(rawY, window.innerHeight - tipH - 10));

  tooltip.style.left = finalX + 'px';
  tooltip.style.top  = finalY + 'px';
}

const TOOLTIP_COLS = [
  null, // 0 — Año, sin tooltip

  (p) => { // 1 — Código convenio
    const areaId    = p.areaEfectiva ?? state.area;
    const areaLabel = AREAS.find(a => a.id === areaId)?.label ?? areaId;
    const [cabeza, resto] = areaLabel.split('—').map(s => s.trim());
    const codigo = CODIGOS.find(c => c.area === areaId && c.nivel === p.nivelEfectivo)?.codigo ?? p.nivelEfectivo;
    return `<span class="tt-year">${codigo}</span>` +
           `<div>${cabeza}` + (resto ? ` — ${resto}` : '') + `</div>` +
           `<div style="color:#aaa">Nivel ${p.nivelEfectivo}</div>` +
           (p.e2Promovido ? `<div style="color:var(--amarillo);margin-top:4px">↑ Promoción automática E-2 → E-1 (art. XVIII Convenio, 3 años en E-2)</div>` : '');
  },

  (p) => { // 2 — Convenio (tablas BOE)
    if (!p.desglose || !p.salarioConvenio) return null;
    const slate = COLORES.convenio;
    return `<span class="tt-year">${p.year} · Tablas BOE</span>` +
      `<div>Base: <b style="color:${slate}">${fmt(p.desglose.salarioBase)} €</b></div>` +
      `<div>Plus convenio: <b style="color:${slate}">${fmt(p.desglose.plusConvenio)} €</b></div>` +
      `<div>Total tablas: <b style="color:${slate}">${fmt(p.salarioConvenio)} €</b></div>`;
  },

  (p) => { // 3 — Salario real
    const azul = COLORES.real;
    const rojo = COLORES.poder;
    const diff = p.salarioReal - (p.salarioConvenio ?? 0);
    const col  = diff >= 0 ? azul : rojo;
    return `<span class="tt-year">${p.year} · Salario real</span>` +
      `<div>Salario: <b style="color:${azul}">${fmt(p.salarioReal)} €</b></div>` +
      `<div>Vs. tablas: <b style="color:${col}">${diff >= 0 ? '+' : ''}${fmt(diff)} €</b></div>`;
  },

  (p) => { // 4 — Sin absorción
    if (!p.salarioSinAbsorcion || !p.desglose) return null;
    const ambar      = COLORES.sinAbsorcion;
    const slate      = COLORES.convenio;
    const tablasTotal  = p.desglose.salarioBase + p.desglose.plusConvenio;
    const antigPeriodo = p.desglose.antigPeriodo ?? 0;
    const comp         = p.salarioSinAbsorcion - tablasTotal - antigPeriodo;
    return `<span class="tt-year">${p.year} · Sin absorción</span>` +
      `<div>Tablas BOE: <b style="color:${slate}">${fmt(tablasTotal)} €</b></div>` +
      (antigPeriodo > 0 ? `<div>Antigüedad período: <b style="color:${ambar}">${fmt(antigPeriodo)} €</b></div>` : '') +
      `<div>Compl. personal: <b style="color:${ambar}">${fmt(comp)} €</b></div>` +
      `<div>Total: <b style="color:${ambar}">${fmt(p.salarioSinAbsorcion)} €</b></div>`;
  },

  (p) => { // 5 — Trienios
    const ambar = COLORES.sinAbsorcion;
    if (p.trieniosActuales === 0)
      return `<span class="tt-year">${p.year} · Antigüedad</span><div style="color:#aaa">Sin trienios completados</div>`;
    return `<span class="tt-year">${p.year} · Antigüedad</span>` +
      `<div>Trienios: <b style="color:${ambar}">${p.trieniosActuales}</b></div>` +
      (p.desglose?.antig > 0 ? `<div>Importe total: <b style="color:${ambar}">${fmt(p.desglose.antig)} €</b></div>` : '') +
      (p.trienioNuevo ? `<div style="color:${ambar};font-weight:500">Nuevo trienio: +${fmt(p.importeTrienioNuevo)} €</div>` : '');
  },

  (p) => { // 6 — Pérdida absorción
    if (!p.salarioSinAbsorcion) return null;
    const azul  = COLORES.real;
    const ambar = COLORES.sinAbsorcion;
    const rojo  = COLORES.poder;
    if (p.perdidaAbsorcion <= 0)
      return `<span class="tt-year">${p.year} · Absorción</span><div style="color:#aaa">Sin pérdida por absorción</div>`;
    const perdTrienios = Math.min(p.desglose?.antigPeriodo ?? 0, p.perdidaAbsorcion);
    const perdTablas   = Math.max(0, p.perdidaAbsorcion - perdTrienios);
    return `<span class="tt-year">${p.year} · Pérd. absorción</span>` +
      `<div>Sin absorción: <b style="color:${ambar}">${fmt(p.salarioSinAbsorcion)} €</b></div>` +
      `<div>Salario real: <b style="color:${azul}">${fmt(p.salarioReal)} €</b></div>` +
      `<div>Pérdida total: <b style="color:${rojo}">-${fmt(p.perdidaAbsorcion)} €</b></div>` +
      (perdTrienios > 0 ? `<div>· Por trienios del período: <b style="color:${ambar}">-${fmt(perdTrienios)} €</b></div>` : '') +
      (perdTablas   > 0 ? `<div>· Por subida de tablas: <b style="color:${ambar}">-${fmt(perdTablas)} €</b></div>` : '');
  },

  (p) => { // 7 — Salario IPC
    const rojo    = COLORES.poder;
    const ipcAcum = _serie.length > 0 ? p.salarioPoder / _serie[0].salarioReal - 1 : 0;
    return `<span class="tt-year">${p.year} · Equiv. IPC</span>` +
      `<div>IPC acumulado: <b style="color:${rojo}">+${fmtPct(ipcAcum)}</b></div>` +
      `<div>Salario equiv.: <b style="color:${rojo}">${fmt(p.salarioPoder)} €</b></div>`;
  },

  (p) => { // 8 — Pérdida poder adq.
    const azul = COLORES.real;
    const rojo = COLORES.poder;
    if (p.perdidaPoder <= 0)
      return `<span class="tt-year">${p.year} · Poder adq.</span><div style="color:#aaa">Sin pérdida de poder adquisitivo</div>`;
    return `<span class="tt-year">${p.year} · Pérd. poder adq.</span>` +
      `<div>Equiv. IPC: <b style="color:${rojo}">${fmt(p.salarioPoder)} €</b></div>` +
      `<div>Salario real: <b style="color:${azul}">${fmt(p.salarioReal)} €</b></div>` +
      `<div>Pérdida: <b style="color:${rojo}">-${fmt(p.perdidaPoder)} €</b></div>` +
      `<div style="color:#aaa;margin-top:4px;line-height:1.5">Para mantener el poder adquisitivo<br>de tu salario de ${state.yearInicio - 1},<br>necesitarías cobrar <b style="color:${rojo}">${fmt(p.salarioPoder)} €</b> en ${p.year}.</div>`;
  },

  (p) => { // 9 — IPC año anterior (modelo retardado)
    if (!p.ipc) return null;
    const rojo = COLORES.poder;
    return `<span class="tt-year">${p.year} · IPC ${p.year - 1}</span>` +
      `<div>Media anual ${p.year - 1}: <b style="color:${rojo}">${fmtPct(p.ipc.valor)}</b></div>` +
      `<div style="color:#aaa">${p.ipc.prevision ? 'Previsión · pendiente dato INE' : 'Dato definitivo INE'}</div>` +
      `<div style="color:#aaa;margin-top:4px;line-height:1.5">El IPC de ${p.year - 1} es la subida que<br>debería haberse aplicado a principios<br>de ${p.year}. Si no se aplica, la pérdida<br>de poder adquisitivo se acumula<br>durante todo ${p.year}.</div>`;
  },
];

function buildTablaTooltip(colIdx, p) {
  const fn = TOOLTIP_COLS[colIdx];
  if (!fn) return null;
  return fn(p);
}
