/**
 * app.js — Orquestador de la interfaz
 *
 * Lee el estado, escucha eventos y coordina los módulos de render.
 * La lógica de negocio está en data.js; los detalles de render, en js/ui/.
 */

import { CODIGOS, YEARS }                                         from './tablas.js';
import { generarSerie, getTablaSalarial, calcularAcumulados, proyectarAgotamientoAbsorcion } from './calculos.js';

import { state }                                                  from './state.js';
import { el, fmt, parseSalario, fmtInput, crearOption }           from './utils.js';
import { descCodigo, notaHistorica, bindCombobox }                from './ui/combobox.js';
import { renderGrafico, onGraficoHover, getSerie }                from './ui/grafico.js';
import { renderTabla, onTablaHover }                              from './ui/tabla.js';
import { agregarMod, eliminarMod, renderMods }                    from './ui/mods.js';

// ---------------------------------------------------------------------------
// INICIALIZACIÓN
// ---------------------------------------------------------------------------
export function init() {
  leerDesdeURL();
  restaurarDesdeLocalStorage();
  poblarSelectores();
  bindEventos();
  actualizarBtnGuardar();
  refreshMods();
  validarArea();
  validarSalario();
  actualizar();
}

function poblarSelectores() {
  YEARS.forEach(y => {
    el('sel-year').appendChild(crearOption(y, y));
    el('sel-year-fin').appendChild(crearOption(y, y));
    el('mod-year').appendChild(crearOption(y, y));
  });
  el('sel-year').value               = state.yearInicio;
  el('sel-year-fin').value           = state.yearFin;
  el('mod-year').value               = 2024;
  el('lbl-year-inicio').textContent  = state.yearInicio;

  const codigoInicial = CODIGOS.find(c => c.area === state.area && c.nivel === state.nivelInicio);
  if (codigoInicial) {
    el('inp-codigo').value            = codigoInicial.codigo;
    el('inp-codigo-desc').textContent = descCodigo(codigoInicial) + notaHistorica(codigoInicial.area);
    el('inp-codigo-clear').hidden     = false;
  }

  el('inp-salario').value = fmtInput(state.salarioInicio);

  const [altaYear, altaMes] = state.fechaAlta.split('-');
  for (let y = 1990; y <= 2026; y++) el('alta-year').appendChild(crearOption(y, y));
  el('alta-year').value = altaYear;
  el('alta-mes').value  = +altaMes;
}

// ---------------------------------------------------------------------------
// EVENTOS
// ---------------------------------------------------------------------------
function bindEventos() {
  bindCombobox('inp-codigo', 'inp-codigo-lista', c => {
    state.area        = c.area;
    state.nivelInicio = c.nivel;
    el('inp-codigo-desc').textContent = descCodigo(c) + notaHistorica(c.area);
    validarArea(); validarSalario(); actualizar();
  }, 'inp-codigo-clear');

  bindCombobox('mod-codigo', 'mod-codigo-lista', () => {}, 'mod-codigo-clear');

  el('sel-year').addEventListener('change', e => {
    state.yearInicio = +e.target.value;
    el('lbl-year-inicio').textContent = state.yearInicio;
    if (state.yearFin < state.yearInicio) { state.yearFin = state.yearInicio; el('sel-year-fin').value = state.yearFin; }
    validarArea(); validarSalario(); validarFechaAlta(); actualizar();
  });

  el('sel-year-fin').addEventListener('change', e => {
    state.yearFin = +e.target.value;
    if (state.yearFin < state.yearInicio) { state.yearFin = state.yearInicio; el('sel-year-fin').value = state.yearFin; }
    actualizar();
  });

  el('inp-salario').addEventListener('input', e => {
    const v = parseSalario(e.target.value);
    if (!isNaN(v) && v > 0) { state.salarioInicio = v; validarSalario(); actualizar(); }
  });
  el('inp-salario').addEventListener('blur',  e => { const v = parseSalario(e.target.value); if (!isNaN(v) && v > 0) e.target.value = fmtInput(v); });
  el('inp-salario').addEventListener('focus', e => e.target.select());

  const onAltaChange = () => {
    const y = el('alta-year').value;
    const m = String(el('alta-mes').value).padStart(2, '0');
    state.fechaAlta = `${y}-${m}`;
    validarFechaAlta(); actualizar();
  };
  el('alta-year').addEventListener('change', onAltaChange);
  el('alta-mes').addEventListener('change',  onAltaChange);

  document.querySelectorAll('.num-up, .num-down').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = el(btn.dataset.target);
      const v     = parseSalario(input.value) || 0;
      input.value = fmtInput(Math.max(0, v + (btn.classList.contains('num-up') ? 100 : -100)));
      input.dispatchEvent(new Event('input'));
    });
  });

  el('mod-val-salario').addEventListener('blur',  e => { const v = parseSalario(e.target.value); if (!isNaN(v) && v > 0) e.target.value = fmtInput(v); });
  el('mod-val-salario').addEventListener('focus', e => e.target.select());

  el('mod-tipo').addEventListener('change', e => {
    const esNivel = e.target.value === 'nivel';
    el('wrap-mod-nivel').style.display   = esNivel ? '' : 'none';
    el('wrap-mod-salario').style.display = esNivel ? 'none' : '';
  });

  el('btn-add-mod').addEventListener('click', () => {
    if (agregarMod()) { refreshMods(); actualizar(); }
  });

  window.addEventListener('resize', () => { if (getSerie().length) renderGrafico(getSerie()); });

  el('grafico').addEventListener('mousemove', onGraficoHover);
  el('grafico').addEventListener('mouseleave', () => { el('grafico-tooltip').style.display = 'none'; });

  el('tabla-body').addEventListener('mousemove', onTablaHover);
  el('tabla-body').addEventListener('mouseleave', () => { el('tabla-tooltip').style.display = 'none'; });

  el('btn-guardar').addEventListener('click', () => {
    if (localStorage.getItem(LS_KEY)) {
      localStorage.removeItem(LS_KEY);
    } else {
      guardarEnLocalStorage();
    }
    actualizarBtnGuardar();
  });

  el('btn-compartir').addEventListener('click', () => {
    const btn    = el('btn-compartir');
    const codigo = CODIGOS.find(c => c.area === state.area && c.nivel === state.nivelInicio);
    if (!codigo) return;
    const p   = new URLSearchParams({ yi: state.yearInicio, yf: state.yearFin, g: codigo.codigo, s: state.salarioInicio, a: state.fechaAlta });
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

  document.querySelectorAll('.th-help').forEach(helpEl => {
    const popup = helpEl.querySelector('.th-help-popup');
    if (!popup) return;
    helpEl.addEventListener('mouseenter', () => {
      const r = helpEl.getBoundingClientRect();
      const W = 400;
      popup.style.top = (r.bottom + 6) + 'px';
      if      (popup.classList.contains('th-help-popup--left'))  popup.style.left = Math.max(4, r.right - W) + 'px';
      else if (popup.classList.contains('th-help-popup--right')) popup.style.left = r.left + 'px';
      else                                                        popup.style.left = Math.max(4, r.left + r.width / 2 - W / 2) + 'px';
      popup.style.visibility = 'visible';
    });
    helpEl.addEventListener('mouseleave', () => { popup.style.visibility = 'hidden'; });
  });
}

// ---------------------------------------------------------------------------
// MODIFICACIONES — coordinación entre mods.js y el ciclo principal
// ---------------------------------------------------------------------------
function refreshMods() {
  renderMods(id => { eliminarMod(id); refreshMods(); actualizar(); });
}

// ---------------------------------------------------------------------------
// VALIDACIONES
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
  const errorEl  = el('error-alta');
  const yearAlta = parseInt(state.fechaAlta.split('-')[0], 10);
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
// localStorage — guardar y restaurar configuración
// ---------------------------------------------------------------------------
const LS_KEY = 'salariosTic_v1';

const SVG_GUARDAR = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>';

function actualizarBtnGuardar() {
  const btn     = el('btn-guardar');
  const guardado = !!localStorage.getItem(LS_KEY);
  btn.innerHTML = guardado
    ? `${SVG_GUARDAR} ✓ Guardado — clic para borrar`
    : `${SVG_GUARDAR} Guardar`;
  btn.classList.toggle('guardado', guardado);
}

function guardarEnLocalStorage() {
  const datos = {
    yearInicio:    state.yearInicio,
    yearFin:       state.yearFin,
    area:          state.area,
    nivelInicio:   state.nivelInicio,
    salarioInicio: state.salarioInicio,
    fechaAlta:     state.fechaAlta,
    modificaciones: state.modificaciones,
    _nextId:        state._nextId,
  };
  localStorage.setItem(LS_KEY, JSON.stringify(datos));
  actualizarBtnGuardar();
}

function restaurarDesdeLocalStorage() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return;
  try {
    const datos = JSON.parse(raw);
    if (YEARS.includes(datos.yearInicio))                              state.yearInicio    = datos.yearInicio;
    if (YEARS.includes(datos.yearFin) && datos.yearFin >= state.yearInicio) state.yearFin = datos.yearFin;
    if (datos.area && datos.nivelInicio)                               { state.area = datos.area; state.nivelInicio = datos.nivelInicio; }
    if (datos.salarioInicio > 0)                                       state.salarioInicio = datos.salarioInicio;
    if (datos.fechaAlta && /^\d{4}-\d{2}$/.test(datos.fechaAlta))     state.fechaAlta     = datos.fechaAlta;
    if (Array.isArray(datos.modificaciones))                           state.modificaciones = datos.modificaciones;
    if (datos._nextId > 1)                                             state._nextId        = datos._nextId;
  } catch (_) { localStorage.removeItem(LS_KEY); }
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
  if (codigo) { state.area = codigo.area; state.nivelInicio = codigo.nivel; }

  const s = parseFloat(p.get('s'));
  if (!isNaN(s) && s > 0) state.salarioInicio = s;

  const a = p.get('a');
  if (a && /^\d{4}-\d{2}$/.test(a)) {
    const yearAlta = parseInt(a.split('-')[0], 10);
    if (yearAlta >= 1990 && yearAlta <= 2026) state.fechaAlta = a;
  }

  history.replaceState(null, '', location.pathname);
}

// ---------------------------------------------------------------------------
// CICLO PRINCIPAL
// ---------------------------------------------------------------------------
function actualizar() {
  if (!validarArea())      return;
  if (!validarFechaAlta()) return;
  if (!validarSalario())   return;
  const serie = generarSerie(state);
  if (serie.length === 0)  return;
  renderKPIs(serie);
  renderGrafico(serie);
  renderTabla(serie);
  renderProyeccion(serie);
}

// ---------------------------------------------------------------------------
// KPIs
// ---------------------------------------------------------------------------
function renderKPIs(serie) {
  const ultimo = serie[serie.length - 1];
  const acum   = calcularAcumulados(serie);

  el('kpi-salario-actual').textContent    = fmt(ultimo.salarioReal) + ' €';
  el('kpi-sin-absorcion').textContent     = ultimo.salarioSinAbsorcion ? fmt(ultimo.salarioSinAbsorcion) + ' €' : '—';
  el('kpi-perdida-absorcion').textContent = acum.perdidaAbsorcion > 0 ? '−' + fmt(acum.perdidaAbsorcion) + ' €' : '—';
  el('kpi-poder-ipc').textContent         = fmt(ultimo.salarioPoder) + ' €';
  el('kpi-perdida-poder').textContent     = acum.perdidaPoder > 0 ? '−' + fmt(acum.perdidaPoder) + ' €' : '—';
}

// ---------------------------------------------------------------------------
// PROYECCIÓN AGOTAMIENTO ABSORCIÓN
// ---------------------------------------------------------------------------
function renderProyeccion(serie) {
  const contenedor = el('proyeccion-absorcion');
  const resultado  = proyectarAgotamientoAbsorcion(serie, { fechaAlta: state.fechaAlta, yearFin: state.yearFin });

  if (!resultado) {
    contenedor.innerHTML = '';
    contenedor.className = 'proyeccion-absorcion';
    return;
  }

  const yearAlta       = parseInt(state.fechaAlta.split('-')[0], 10);
  const anosEmpresa    = resultado.year - yearAlta;
  const anosEmpresaTxt = `${anosEmpresa} ${anosEmpresa === 1 ? 'año' : 'años'} en la empresa`;

  if (resultado.ocurrido) {
    contenedor.innerHTML =
      `En ${resultado.year} los trienios y las subidas de tablas dejaron de ser absorbibles. ` +
      `Llevabas <b>${anosEmpresaTxt}</b> en la empresa. ` +
      `<b>Tu salario real no puede ser inferior al mínimo de convenio: actualiza el salario en "Añadir modificación".</b>`;
    contenedor.className = 'proyeccion-absorcion ocurrido';
  } else {
    contenedor.innerHTML =
      `Con tu salario actual se estima que en <b>${resultado.year}</b> los trienios y las subidas ` +
      `dejarán de ser absorbibles. Llevarás <b>${anosEmpresaTxt}</b>. ` +
      `<span class="proyeccion-estimacion">(estimación a +3 %/año sobre tablas 2027)</span>`;
    contenedor.className = 'proyeccion-absorcion estimacion';
  }
}
