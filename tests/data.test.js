import { describe, it, expect } from 'vitest';
import {
  MAX_TRIENIOS,
  getTablaSalarial,
  generarSerie,
  calcularAcumulados,
} from '../js/data.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const round = (n, dec = 0) => Math.round(n * 10 ** dec) / 10 ** dec;

// Configuración base usada en la mayoría de tests
const BASE = {
  yearInicio:    2022,
  yearFin:       2026,
  area:          'programacion',
  nivelInicio:   'D-1',
  salarioInicio: 30_000,
  fechaAlta:     '2018-01',
  modificaciones: [],
};

// ---------------------------------------------------------------------------
// getTablaSalarial
// ---------------------------------------------------------------------------
describe('getTablaSalarial', () => {
  it('devuelve null para nivel inexistente', () => {
    expect(getTablaSalarial('Z-9', 2022, 'programacion')).toBeNull();
  });

  it('devuelve null para año fuera de rango', () => {
    expect(getTablaSalarial('D-1', 2028, 'programacion')).toBeNull();
  });

  it('el total es salarioBase + plusConvenio', () => {
    const t = getTablaSalarial('D-1', 2022, 'programacion');
    expect(t).not.toBeNull();
    expect(round(t.total, 2)).toBe(round(t.salarioBase + t.plusConvenio, 2));
  });

  it('las tablas crecen año a año para un mismo nivel', () => {
    const años = [2022, 2023, 2024, 2025, 2026];
    const totales = años.map(y => getTablaSalarial('D-1', 2022, 'programacion')?.total ?? 0);
    // cada año >= el anterior
    for (let i = 1; i < totales.length; i++) {
      expect(totales[i]).toBeGreaterThanOrEqual(totales[i - 1]);
    }
  });
});

// ---------------------------------------------------------------------------
// MAX_TRIENIOS
// ---------------------------------------------------------------------------
describe('MAX_TRIENIOS', () => {
  it('vale 9 (5 + 3 + 1)', () => {
    expect(MAX_TRIENIOS).toBe(9);
  });
});

// ---------------------------------------------------------------------------
// generarSerie — caso base
// ---------------------------------------------------------------------------
describe('generarSerie — caso base', () => {
  const serie = generarSerie(BASE);

  it('genera un punto por año del período', () => {
    expect(serie.length).toBe(5); // 2022–2026
    expect(serie[0].year).toBe(2022);
    expect(serie[4].year).toBe(2026);
  });

  it('salario real sin modificaciones es constante', () => {
    serie.forEach(p => expect(p.salarioReal).toBe(30_000));
  });

  it('salarioSinAbsorcion >= salarioReal en todos los años', () => {
    serie.forEach(p => {
      if (p.salarioSinAbsorcion !== null) {
        expect(p.salarioSinAbsorcion).toBeGreaterThanOrEqual(p.salarioReal);
      }
    });
  });

  it('salarioConvenio <= salarioSinAbsorcion (el complemento es >= 0)', () => {
    serie.forEach(p => {
      if (p.salarioConvenio && p.salarioSinAbsorcion) {
        expect(p.salarioSinAbsorcion).toBeGreaterThanOrEqual(p.salarioConvenio);
      }
    });
  });

  it('perdidaAbsorcion nunca es negativa', () => {
    serie.forEach(p => expect(p.perdidaAbsorcion).toBeGreaterThanOrEqual(0));
  });

  it('salarioPoder crece cada año (IPC acumulado)', () => {
    for (let i = 1; i < serie.length; i++) {
      expect(serie[i].salarioPoder).toBeGreaterThan(serie[i - 1].salarioPoder);
    }
  });

  it('el primer año tiene IPC del año anterior (2021)', () => {
    expect(serie[0].ipc?.valor).toBeCloseTo(0.031, 3);
  });
});

// ---------------------------------------------------------------------------
// generarSerie — trienios
// ---------------------------------------------------------------------------
describe('generarSerie — trienios', () => {
  it('con fechaAlta muy antigua no supera MAX_TRIENIOS', () => {
    const serie = generarSerie({ ...BASE, fechaAlta: '1990-01' });
    serie.forEach(p => expect(p.trieniosActuales).toBeLessThanOrEqual(MAX_TRIENIOS));
  });

  it('sin antigüedad suficiente no hay trienios en 2022', () => {
    const serie = generarSerie({ ...BASE, fechaAlta: '2021-06' });
    expect(serie[0].trieniosActuales).toBe(0);
  });

  it('con fechaAlta 2018-01 hay 1 trienio en 2022', () => {
    const serie = generarSerie(BASE);
    expect(serie[0].trieniosActuales).toBe(1);
  });

  it('trienioNuevo es true el año en que se gana un trienio', () => {
    // fechaAlta 2018-01: 2º trienio en enero 2024
    const serie = generarSerie(BASE);
    const p2024 = serie.find(p => p.year === 2024);
    expect(p2024?.trienioNuevo).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// generarSerie — modificaciones
// ---------------------------------------------------------------------------
describe('generarSerie — modificaciones salariales', () => {
  it('una subida salarial actualiza salarioReal desde ese año', () => {
    const serie = generarSerie({
      ...BASE,
      modificaciones: [{ id: 1, year: 2024, mes: 1, tipo: 'salario', valor: 35_000 }],
    });
    expect(serie.find(p => p.year === 2023)?.salarioReal).toBe(30_000);
    expect(serie.find(p => p.year === 2024)?.salarioReal).toBe(35_000);
    expect(serie.find(p => p.year === 2025)?.salarioReal).toBe(35_000);
  });

  it('tras una subida, salarioSinAbsorcion >= salarioReal', () => {
    const serie = generarSerie({
      ...BASE,
      modificaciones: [{ id: 1, year: 2024, mes: 1, tipo: 'salario', valor: 31_500 }],
    });
    serie.forEach(p => {
      if (p.salarioSinAbsorcion !== null) {
        expect(p.salarioSinAbsorcion).toBeGreaterThanOrEqual(p.salarioReal);
      }
    });
  });

  it('perdidaAbsorcion no puede ser negativa tras una subida salarial', () => {
    const serie = generarSerie({
      ...BASE,
      modificaciones: [{ id: 1, year: 2025, mes: 1, tipo: 'salario', valor: 31_500 }],
    });
    serie.forEach(p => expect(p.perdidaAbsorcion).toBeGreaterThanOrEqual(0));
  });
});

// ---------------------------------------------------------------------------
// calcularAcumulados
// ---------------------------------------------------------------------------
describe('calcularAcumulados', () => {
  it('la suma de perdidaAbsorcion anual coincide con el acumulado', () => {
    const serie = generarSerie(BASE);
    const acum  = calcularAcumulados(serie);
    const suma  = serie.reduce((s, p) => s + p.perdidaAbsorcion, 0);
    expect(round(acum.perdidaAbsorcion, 2)).toBe(round(suma, 2));
  });

  it('la suma de perdidaPoder anual coincide con el acumulado', () => {
    const serie = generarSerie(BASE);
    const acum  = calcularAcumulados(serie);
    const suma  = serie.reduce((s, p) => s + p.perdidaPoder, 0);
    expect(round(acum.perdidaPoder, 2)).toBe(round(suma, 2));
  });
});
