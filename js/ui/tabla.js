// Renderizado de la tabla detalle y tooltips por columna.
// _serieMap es local: se escribe en renderTabla y se lee en onTablaHover.

import { el, fmt, fmtPct, COLORES }                      from '../utils.js';
import { AREAS, CODIGOS, INCREMENTOS }  from '../tablas.js';
import { calcularAcumulados }           from '../calculos.js';
import { state }                                           from '../state.js';

let _serieMap = new Map();

export function renderTabla(serie) {
  const tbody = el('tabla-body');
  tbody.innerHTML = '';
  _serieMap = new Map();

  // Mapa year → salario previo para mostrar % de cambio en modificaciones salariales
  const salModMap = new Map();
  let salPrev = state.salarioInicio;
  [...state.modificaciones]
    .filter(m => m.tipo === 'salario')
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.mes - b.mes)
    .forEach(m => { salModMap.set(m.year, salPrev); salPrev = m.valor; });

  serie.forEach(p => {
    _serieMap.set(p.year, p);

    const tr  = document.createElement('tr');
    const codigo = CODIGOS.find(c => c.area === p.areaEfectiva && c.nivel === p.nivelEfectivo)?.codigo ?? p.nivelEfectivo;

    const ipcTxt = p.ipc
      ? fmtPct(p.ipc.valor) + (p.ipc.prevision ? '<span class="badge-prev">~</span>' : '')
      : '—';

    const trienioTxt = p.trienioNuevo
      ? `<span class="trienio-nuevo">${p.trieniosActuales} · ${fmt(p.desglose.antig)} € (+${fmt(p.importeTrienioNuevo)} €)</span>`
      : p.trieniosActuales > 0 && p.desglose?.antig
        ? `<span style="color:var(--amarillo)">${p.trieniosActuales} · ${fmt(p.desglose.antig)} €</span>`
        : '—';

    const salarioBajoMinimo = p.salarioConvenio !== null && p.salarioReal < p.salarioConvenio;
    if (salarioBajoMinimo) tr.classList.add('fila-bajo-minimo');

    tr.innerHTML = `
      <td>${p.year}</td>
      <td class="nivel">${codigo}${p.e2Promovido ? ' <span class="badge-e2" title="Promoción automática E-2 → E-1 (art. XVIII Convenio)">↑E-1</span>' : ''}</td>
      <td class="teo">${p.desglose
        ? fmt(p.desglose.salarioBase + p.desglose.plusConvenio) + ' €' + (INCREMENTOS[p.year] != null ? ` <b>(+${fmtPct(INCREMENTOS[p.year])})</b>` : '')
        : '—'}</td>
      <td class="teo">${p.desglose?.antig > 0 ? fmt(p.desglose.antig) + ' €' : '—'}</td>
      <td class="val-real${salarioBajoMinimo ? ' bajo-minimo' : ''}">
        ${fmt(p.salarioReal)} €
        ${salModMap.has(p.year) ? ` <b>(+${fmtPct((p.salarioReal - salModMap.get(p.year)) / salModMap.get(p.year))})</b>` : ''}
        ${salarioBajoMinimo ? ' <span class="badge-bajo-minimo" title="Por debajo del mínimo de convenio">!</span>' : ''}
      </td>
      <td class="sinabs">${p.salarioSinAbsorcion ? fmt(p.salarioSinAbsorcion) + ' €' : '—'}</td>
      <td class="trienio">${trienioTxt}</td>
      <td class="${p.perdidaAbsorcion > 0 ? 'sinabs' : ''}">${p.perdidaAbsorcion > 0 ? '-' + fmt(p.perdidaAbsorcion) + ' €' : '—'}</td>
      <td class="val-ipc">${fmt(p.salarioPoder)} €</td>
      <td class="${p.perdidaPoder > 0 ? 'neg' : ''}">${p.perdidaPoder > 0 ? '-' + fmt(p.perdidaPoder) + ' €' : '—'}</td>
      <td class="ipc">${ipcTxt}</td>
    `;
    tbody.appendChild(tr);
  });

  // Fila de totales
  const acum = calcularAcumulados(serie);
  let factorIpc = 1, tienePrevision = false;
  serie.forEach(p => { if (p.ipc) { factorIpc *= (1 + p.ipc.valor); if (p.ipc.prevision) tienePrevision = true; } });

  const tfoot = el('tabla-foot');
  const trTot = document.createElement('tr');
  trTot.innerHTML = `
    <td class="total-label">Total</td>
    <td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td>
    <td class="sinabs">${acum.perdidaAbsorcion > 0 ? '−' + fmt(acum.perdidaAbsorcion) + ' €' : '—'}</td>
    <td>—</td>
    <td class="${acum.perdidaPoder > 0 ? 'neg' : ''}">${acum.perdidaPoder > 0 ? '−' + fmt(acum.perdidaPoder) + ' €' : '—'}</td>
    <td class="ipc">${(tienePrevision ? '~' : '') + '+' + fmtPct(factorIpc - 1)}</td>
  `;
  tfoot.innerHTML = '';
  tfoot.appendChild(trTot);
}

export function onTablaHover(e) {
  const td      = e.target.closest('td');
  const tooltip = el('tabla-tooltip');
  if (!td) { tooltip.style.display = 'none'; return; }

  const tr = td.closest('tr');
  if (!tr) { tooltip.style.display = 'none'; return; }

  const colIdx = Array.from(tr.children).indexOf(td);
  const year   = parseInt(tr.firstElementChild.textContent, 10);
  const p      = _serieMap.get(year);
  if (!p) { tooltip.style.display = 'none'; return; }

  const html = _buildTooltip(colIdx, p);
  if (!html) { tooltip.style.display = 'none'; return; }

  tooltip.innerHTML     = html;
  tooltip.style.left    = '-9999px';
  tooltip.style.top     = '0px';
  tooltip.style.display = 'block';

  const tipW   = tooltip.offsetWidth;
  const tipH   = tooltip.offsetHeight;
  const rawX   = e.clientX + 14;
  const rawY   = e.clientY - 10;
  const finalX = rawX + tipW + 10 > window.innerWidth  ? e.clientX - tipW - 14 : rawX;
  const finalY = Math.max(0, Math.min(rawY, window.innerHeight - tipH - 10));
  tooltip.style.left = finalX + 'px';
  tooltip.style.top  = finalY + 'px';
}

// ---------------------------------------------------------------------------
// Tooltips por columna
// ---------------------------------------------------------------------------
const TOOLTIP_COLS = [
  null, // 0 — Año

  (p) => { // 1 — Código convenio
    const areaId    = p.areaEfectiva ?? state.area;
    const areaLabel = AREAS.find(a => a.id === areaId)?.label ?? areaId;
    const [cabeza, resto] = areaLabel.split('—').map(s => s.trim());
    const codigo = CODIGOS.find(c => c.area === areaId && c.nivel === p.nivelEfectivo)?.codigo ?? p.nivelEfectivo;
    return `<span class="tt-year">${codigo}</span>` +
           `<div>${cabeza}${resto ? ` — ${resto}` : ''}</div>` +
           `<div style="color:#aaa">Nivel ${p.nivelEfectivo}</div>` +
           (p.e2Promovido ? `<div style="color:var(--amarillo);margin-top:4px">↑ Promoción automática E-2 → E-1 (art. XVIII Convenio, 3 años en E-2)</div>` : '');
  },

  (p) => { // 2 — Convenio (tablas BOE, sin antigüedad)
    if (!p.desglose) return null;
    const c = COLORES.convenio;
    const tablasTotal = p.desglose.salarioBase + p.desglose.plusConvenio;
    return `<span class="tt-year">${p.year} · Tablas BOE</span>` +
      `<div>Base: <b style="color:${c}">${fmt(p.desglose.salarioBase)} €</b></div>` +
      `<div>Plus convenio: <b style="color:${c}">${fmt(p.desglose.plusConvenio)} €</b></div>` +
      `<div>Total tablas: <b style="color:${c}">${fmt(tablasTotal)} €</b></div>`;
  },

  (p) => { // 3 — Antigüedad
    if (!p.desglose) return null;
    const c = COLORES.convenio;
    const antig = p.desglose.antig ?? 0;
    if (antig === 0) return `<span class="tt-year">${p.year} · Antigüedad</span><div style="color:#aaa">Sin trienios completados</div>`;
    return `<span class="tt-year">${p.year} · Antigüedad</span>` +
      `<div>Trienios: <b style="color:${c}">${p.trieniosActuales}</b></div>` +
      `<div>Importe: <b style="color:${c}">${fmt(antig)} €</b></div>`;
  },

  (p) => { // 4 — Salario real
    const azul = COLORES.real, rojo = COLORES.poder;
    const diff = p.salarioReal - (p.salarioConvenio ?? 0);
    return `<span class="tt-year">${p.year} · Salario real</span>` +
      `<div>Salario: <b style="color:${azul}">${fmt(p.salarioReal)} €</b></div>` +
      `<div>Vs. convenio + antigüedad: <b style="color:${diff >= 0 ? azul : rojo}">${diff >= 0 ? '+' : ''}${fmt(diff)} €</b></div>`;
  },

  (p) => { // 4 — Sin absorción
    if (!p.salarioSinAbsorcion || !p.desglose) return null;
    const ambar = COLORES.sinAbsorcion, slate = COLORES.convenio;
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
    const azul = COLORES.real, ambar = COLORES.sinAbsorcion, rojo = COLORES.poder;
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
    const ipcAcum = p.salarioPoder / state.salarioInicio - 1;
    return `<span class="tt-year">${p.year} · Equiv. IPC</span>` +
      `<div>IPC acumulado: <b style="color:${rojo}">+${fmtPct(ipcAcum)}</b></div>` +
      `<div>Salario equiv.: <b style="color:${rojo}">${fmt(p.salarioPoder)} €</b></div>`;
  },

  (p) => { // 8 — Pérdida poder adq.
    const azul = COLORES.real, rojo = COLORES.poder;
    if (p.perdidaPoder <= 0)
      return `<span class="tt-year">${p.year} · Poder adq.</span><div style="color:#aaa">Sin pérdida de poder adquisitivo</div>`;
    return `<span class="tt-year">${p.year} · Pérd. poder adq.</span>` +
      `<div>Equiv. IPC: <b style="color:${rojo}">${fmt(p.salarioPoder)} €</b></div>` +
      `<div>Salario real: <b style="color:${azul}">${fmt(p.salarioReal)} €</b></div>` +
      `<div>Pérdida: <b style="color:${rojo}">-${fmt(p.perdidaPoder)} €</b></div>` +
      `<div style="color:#aaa;margin-top:4px;line-height:1.5">Para mantener el poder adquisitivo de tu salario de ${state.yearInicio - 1}, necesitarías cobrar <b style="color:${rojo}">${fmt(p.salarioPoder)} €</b> en ${p.year}.</div>`;
  },

  (p) => { // 9 — IPC año anterior
    if (!p.ipc) return null;
    const rojo = COLORES.poder;
    return `<span class="tt-year">${p.year} · IPC ${p.year - 1}</span>` +
      `<div>Media anual ${p.year - 1}: <b style="color:${rojo}">${fmtPct(p.ipc.valor)}</b></div>` +
      `<div style="color:#aaa">${p.ipc.prevision ? 'Previsión · pendiente dato INE' : 'Dato definitivo INE'}</div>` +
      `<div style="color:#aaa;margin-top:4px;line-height:1.5">El IPC de ${p.year - 1} es la subida que debería haberse aplicado a principios de ${p.year}. Si no se aplica, la pérdida de poder adquisitivo se acumula durante todo ${p.year}.</div>`;
  },
];

function _buildTooltip(colIdx, p) {
  const fn = TOOLTIP_COLS[colIdx];
  return fn ? fn(p) : null;
}
