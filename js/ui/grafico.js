// Gráfico canvas 2D y tooltip de hover.
// _serie es local: se escribe en renderGrafico y se lee en onGraficoHover.

import { el, fmt, fmtK, COLORES } from '../utils.js';

let _serie = [];

export const getSerie = () => _serie;

export function renderGrafico(serie) {
  _serie = serie;

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

  const vals = serie.flatMap(p => [
    p.salarioReal,
    p.salarioConvenio     ?? 0,
    p.salarioSinAbsorcion ?? 0,
    p.salarioPoder,
  ]).filter(v => v > 0);

  const minVal = Math.min(...vals) * 0.94;
  const maxVal = Math.max(...vals) * 1.06;

  const xPos = i => pad.left + (serie.length > 1 ? (i / (serie.length - 1)) * gW : gW / 2);
  const yPos = v => pad.top  + gH - ((v - minVal) / (maxVal - minVal)) * gH;

  // Grid y etiquetas eje Y
  ctx.strokeStyle = COLORES.grid;
  ctx.lineWidth   = 1;
  ctx.setLineDash([4, 4]);
  ctx.font        = '11px "IBM Plex Mono","Courier New",monospace';
  for (let i = 0; i <= 5; i++) {
    const v = minVal + (maxVal - minVal) * (i / 5);
    const y = yPos(v);
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + gW, y); ctx.stroke();
    ctx.fillStyle = COLORES.texto;
    ctx.textAlign = 'right';
    ctx.fillText(fmtK(v) + ' €', pad.left - 8, y + 4);
  }
  ctx.setLineDash([]);

  // Etiquetas eje X
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
      .map((p, i) => { const v = getter(p); return (v !== null && v > 0) ? { x: xPos(i), y: yPos(v) } : null; })
      .filter(Boolean);
    if (pts.length < 2) return;
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.setLineDash(dash);
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo : ctx.lineTo).call(ctx, p.x, p.y));
    ctx.stroke(); ctx.setLineDash([]);
    pts.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); });
  }

  // Área sombreada entre salario real y equiv. IPC
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

  // Círculo doble en años con trienio nuevo
  serie.forEach((p, i) => {
    if (!p.trienioNuevo || !p.salarioSinAbsorcion) return;
    const x = xPos(i); const y = yPos(p.salarioSinAbsorcion);
    ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fillStyle = COLORES.sinAbsorcion; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fillStyle = COLORES.fondo;        ctx.fill();
  });

  // Leyenda
  const leyenda = [
    { color: COLORES.convenio,     label: 'Convenio + antigüedad' },
    { color: COLORES.real,         label: 'Salario real'   },
    { color: COLORES.sinAbsorcion, label: 'Sin absorción *'},
    { color: COLORES.poder,        label: 'Equiv. IPC'     },
  ];
  ctx.font = '10px "IBM Plex Mono","Courier New",monospace';
  let lx = pad.left;
  const ly = H - 8;
  leyenda.forEach(l => {
    ctx.strokeStyle = l.color; ctx.lineWidth = 2; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 22, ly); ctx.stroke();
    ctx.fillStyle = '#777'; ctx.textAlign = 'left';
    ctx.fillText(l.label, lx + 26, ly + 4);
    lx += ctx.measureText(l.label).width + 52;
  });

  ctx.font = 'bold 10px "IBM Plex Mono","Courier New",monospace';
  ctx.fillStyle = '#777';
  ctx.textAlign = 'left';
  ctx.fillText('* Solo incluye trienios generados en el período analizado', lx, ly + 4);
}

export function onGraficoHover(e) {
  if (_serie.length === 0) return;

  const canvas  = el('grafico');
  const wrapper = canvas.parentElement;
  const rect    = canvas.getBoundingClientRect();
  const scaleX  = canvas.width / rect.width;
  const mx      = (e.clientX - rect.left) * scaleX;

  const pad  = { top: 28, right: 20, bottom: 52, left: 76 };
  const gW   = canvas.width - pad.left - pad.right;
  const xPos = i => pad.left + (_serie.length > 1 ? (i / (_serie.length - 1)) * gW : gW / 2);

  let nearest = 0, minDist = Infinity;
  _serie.forEach((_, i) => { const dx = Math.abs(mx - xPos(i)); if (dx < minDist) { minDist = dx; nearest = i; } });

  const tooltip = el('grafico-tooltip');
  if (minDist / scaleX > 40) { tooltip.style.display = 'none'; return; }

  const p = _serie[nearest];
  let html = `<span class="tt-year">${p.year}</span>`;
  if (p.salarioConvenio)    html += `<div>Convenio: <b style="color:#6b7280">${fmt(p.salarioConvenio)} €</b></div>`;
  html += `<div>Salario real: <b style="color:var(--azul)">${fmt(p.salarioReal)} €</b></div>`;
  if (p.salarioSinAbsorcion) html += `<div>Sin absorción: <b style="color:var(--amarillo)">${fmt(p.salarioSinAbsorcion)} €</b></div>`;
  if (p.trieniosActuales > 0) {
    html += `<div style="color:var(--gris-5)">Trienios: ${p.trieniosActuales}`;
    if (p.trienioNuevo) html += ` <span class="tt-nuevo">(nuevo +${fmt(p.importeTrienioNuevo)} €)</span>`;
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
