// Utilidades compartidas: DOM, formato de números y colores.
// Sin dependencias de otros módulos propios.

export const el = id => document.getElementById(id);

export function crearOption(value, text) {
  const o = document.createElement('option');
  o.value = value;
  o.textContent = text;
  return o;
}

export const fmt = n =>
  n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const fmtK = n =>
  Math.abs(n) >= 1000
    ? (n / 1000).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' k'
    : fmt(n);

export const fmtPct = v =>
  (v * 100).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';

export const parseSalario = s => parseFloat(String(s).replace(/\./g, '').replace(',', '.'));

export const fmtInput = n =>
  isNaN(n) || n <= 0 ? '' : n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const COLORES = {
  real:         '#1a7a8a',
  sinAbsorcion: '#9e6c00',
  convenio:     '#6b7280',
  poder:        '#c0392b',
  grid:         '#d8d4cc',
  texto:        '#777',
  fondo:        '#f5f4f0',
};
