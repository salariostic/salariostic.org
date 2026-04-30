/**
 * calculos.js — Lógica de cálculo del convenio TIC
 *
 * Funciones puras sin referencias al DOM.
 * Los datos del BOE están en tablas.js; este fichero solo contiene el modelo.
 */

import { IPC, TRIENIOS, MAX_TRIENIOS, TABLAS, YEARS } from './tablas.js';

// ---------------------------------------------------------------------------
// ACCESO A TABLAS
// ---------------------------------------------------------------------------

export function getTablaSalarial(nivel, year, area = 'programacion') {
  const areaTablas = TABLAS[area];
  if (!areaTablas) return null;
  const tabla = areaTablas[year];
  if (!tabla?.niveles?.[nivel]) return null;
  const { salarioBase, plusConvenio } = tabla.niveles[nivel];
  return { salarioBase, plusConvenio, total: salarioBase + plusConvenio };
}

// ---------------------------------------------------------------------------
// ANTIGÜEDAD
// ---------------------------------------------------------------------------

function trieniosCompletados(fechaAlta, year) {
  const inicio = new Date(fechaAlta);
  const fin    = new Date(year, 11, 31);
  const meses  = (fin.getFullYear() - inicio.getFullYear()) * 12
               + (fin.getMonth()    - inicio.getMonth());
  return Math.min(MAX_TRIENIOS, Math.max(0, Math.floor(meses / 36)));
}

function importeAntiguedad(nivel, year, nTrienios, area = 'programacion') {
  if (nTrienios <= 0) return 0;
  const t = getTablaSalarial(nivel, year, area);
  if (!t) return 0;

  const sb = t.salarioBase;
  const { tramo1, tramo2, tramo3 } = TRIENIOS;
  let total = 0, r = nTrienios;

  const t1 = Math.min(r, tramo1.cantidad); total += sb * tramo1.porcentaje * t1; r -= t1;
  if (r > 0) { const t2 = Math.min(r, tramo2.cantidad); total += sb * tramo2.porcentaje * t2; r -= t2; }
  if (r > 0) total += sb * tramo3.porcentaje * Math.min(r, tramo3.cantidad);

  return total;
}

// ---------------------------------------------------------------------------
// IPC
// ---------------------------------------------------------------------------

function aplicarIPC(salario, yearDesde, yearHasta) {
  let s = salario;
  for (let y = yearDesde; y < yearHasta; y++) {
    if (IPC[y]) s *= (1 + IPC[y].valor);
  }
  return s;
}

// ---------------------------------------------------------------------------
// SALARIO TEÓRICO DE CONVENIO
// ---------------------------------------------------------------------------

function salarioTeoricoConvenio(nivel, year, fechaAlta, area = 'programacion') {
  const t = getTablaSalarial(nivel, year, area);
  if (!t) return null;
  const trienos = trieniosCompletados(fechaAlta, year);
  const antig   = importeAntiguedad(nivel, year, trienos, area);
  return { salarioBase: t.salarioBase, plusConvenio: t.plusConvenio, trienos, antig, total: t.total + antig };
}

// ---------------------------------------------------------------------------
// GENERACIÓN DE SERIE — helpers internos
// ---------------------------------------------------------------------------

function _resolverEstadoAnual(year, mods, { nivel, area, salario, complemento }, fechaAlta) {
  let e2Promovido = false;

  mods.filter(m => m.year === year).forEach(m => {
    if (m.tipo === 'nivel') { nivel = m.valor; if (m.area) area = m.area; }
    if (m.tipo === 'salario') {
      salario = m.valor;
      const t = getTablaSalarial(nivel, year, area);
      complemento = t ? m.valor - t.total : 0;
    }
  });

  if (nivel === 'E-2' && year >= 2023 && trieniosCompletados(fechaAlta, year) >= 1) {
    nivel = 'E-1'; e2Promovido = true;
  }

  return { nivel, area, salario, complemento, e2Promovido };
}

function _calcularDatosTrienio({ nivel, year, fechaAlta, yearInicio, trieniosPrePeriodo, trieniosActuales, area }) {
  const trieniosAnteriores = year > yearInicio
    ? trieniosCompletados(fechaAlta, year - 1)
    : trieniosPrePeriodo;

  const trienioNuevo       = trieniosActuales > trieniosAnteriores;
  const importeTrienioNuevo = trienioNuevo
    ? importeAntiguedad(nivel, year, trieniosActuales, area)
      - importeAntiguedad(nivel, year, trieniosActuales - 1, area)
    : 0;

  // Solo trienios del período: los previos ya estaban absorbidos y distorsionan la comparación.
  const importeAntigPeriodo = importeAntiguedad(nivel, year, trieniosActuales, area)
                            - importeAntiguedad(nivel, year, trieniosPrePeriodo, area);

  return { trienioNuevo, importeTrienioNuevo, importeAntigPeriodo };
}

// ---------------------------------------------------------------------------
// API PÚBLICA
// ---------------------------------------------------------------------------

export function generarSerie({
  yearInicio,
  yearFin = 2026,
  area = 'programacion',
  nivelInicio,
  salarioInicio,
  fechaAlta,
  modificaciones = [],
}) {
  const mods             = [...modificaciones].sort((a, b) => a.year !== b.year ? a.year - b.year : a.mes - b.mes);
  const years            = YEARS.filter(y => y >= yearInicio && y <= yearFin);
  const trieniosPrePeriodo = trieniosCompletados(fechaAlta, yearInicio - 1);

  const tablaInicio = getTablaSalarial(nivelInicio, yearInicio, area);
  let estado = {
    nivel:       nivelInicio,
    area,
    salario:     salarioInicio,
    complemento: tablaInicio ? salarioInicio - tablaInicio.total : 0,
  };

  return years.map(year => {
    const { nivel, area: areaEf, salario, complemento, e2Promovido } =
      _resolverEstadoAnual(year, mods, estado, fechaAlta);
    estado = { nivel, area: areaEf, salario, complemento };

    const tablas = getTablaSalarial(nivel, year, areaEf);
    const teo    = salarioTeoricoConvenio(nivel, year, fechaAlta, areaEf);
    const poder  = aplicarIPC(salarioInicio, yearInicio - 1, year);

    const trieniosActuales = teo?.trienos ?? 0;
    const { trienioNuevo, importeTrienioNuevo, importeAntigPeriodo } = _calcularDatosTrienio({
      nivel, year, fechaAlta, yearInicio, trieniosPrePeriodo, trieniosActuales, area: areaEf,
    });

    const salarioSinAbsorcion = tablas ? complemento + tablas.total + importeAntigPeriodo : null;

    return {
      year,
      e2Promovido,
      areaEfectiva:        areaEf,
      nivelEfectivo:       nivel,
      salarioReal:         salario,
      salarioConvenio:     teo?.total ?? null,
      salarioSinAbsorcion,
      salarioPoder:        poder,
      perdidaAbsorcion:    salarioSinAbsorcion ? Math.max(0, salarioSinAbsorcion - salario) : 0,
      perdidaPoder:        Math.max(0, poder - salario),
      trieniosActuales,
      trienioNuevo,
      importeTrienioNuevo,
      ipc:                 IPC[year - 1] ?? null,
      desglose:            teo ? {
        salarioBase:  teo.salarioBase,
        plusConvenio: teo.plusConvenio,
        trienos:      teo.trienos,
        antig:        teo.antig,
        antigPeriodo: importeAntigPeriodo,
      } : null,
    };
  });
}

export function proyectarAgotamientoAbsorcion(serie, { fechaAlta, yearFin }) {
  for (const p of serie) {
    if (p.salarioConvenio !== null && p.salarioConvenio >= p.salarioReal) {
      return { year: p.year, ocurrido: true, estimacion: false };
    }
  }

  if (!serie.length) return null;
  const ultimo     = serie[serie.length - 1];
  let   nivel      = ultimo.nivelEfectivo;
  const area       = ultimo.areaEfectiva;
  const salarioRef = ultimo.salarioReal;

  const getTabla = (niv, year) => {
    const t = getTablaSalarial(niv, year, area);
    if (t) return t;
    const base = getTablaSalarial(niv, 2027, area);
    if (!base) return null;
    const f = Math.pow(1.03, year - 2027);
    return { salarioBase: base.salarioBase * f, total: base.total * f };
  };

  const calcAntig = (sb, n) => {
    if (n <= 0) return 0;
    let total = 0, r = n;
    const t1 = Math.min(r, 5); total += sb * 0.05 * t1; r -= t1;
    if (r > 0) { const t2 = Math.min(r, 3); total += sb * 0.10 * t2; r -= t2; }
    if (r > 0) total += sb * 0.05 * Math.min(r, 1);
    return total;
  };

  for (let year = yearFin + 1; year <= 2060; year++) {
    if (nivel === 'E-2' && trieniosCompletados(fechaAlta, year) >= 1) nivel = 'E-1';
    const t = getTabla(nivel, year);
    if (!t) return null;
    const nTrienios = trieniosCompletados(fechaAlta, year);
    if (t.total + calcAntig(t.salarioBase, nTrienios) >= salarioRef) {
      return { year, ocurrido: false, estimacion: true };
    }
  }

  return null;
}

export function calcularAcumulados(serie) {
  return serie.reduce(
    (acc, p) => ({
      perdidaAbsorcion: acc.perdidaAbsorcion + p.perdidaAbsorcion,
      perdidaPoder:     acc.perdidaPoder     + p.perdidaPoder,
    }),
    { perdidaAbsorcion: 0, perdidaPoder: 0 }
  );
}
