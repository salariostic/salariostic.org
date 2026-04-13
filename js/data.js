/**
 * data.js — Modelo de datos y cálculos puros
 * Convenio TIC · Todas las áreas · 2022–2026
 *
 * Sin referencias al DOM. Puede testearse de forma aislada.
 *
 * Leyenda valores:
 *   BOE  = verificado contra imagen BOE
 *
 * FUENTES:
 *   XVIII Convenio:      BOE-A-2023-17238 (26/07/2023)
 *   Actualización 2024:  BOE-A-2024-7019  (09/04/2024)
 *   XIX Convenio:        BOE-A-2025-7766  (16/04/2025)
 *   IPC media anual:     INE
 */

// ---------------------------------------------------------------------------
// IPC ESPAÑA — MEDIA ANUAL
// ---------------------------------------------------------------------------
export const IPC = {
  2021: { valor: 0.031, prevision: false },
  2022: { valor: 0.084, prevision: false },
  2023: { valor: 0.035, prevision: false },
  2024: { valor: 0.028, prevision: false },
  2025: { valor: 0.027, prevision: false },
  2026: { valor: 0.024, prevision: true  },
};

// ---------------------------------------------------------------------------
// INCREMENTOS PACTADOS EN CONVENIO (sobre el total del nivel)
// ---------------------------------------------------------------------------
export const INCREMENTOS = {
  // 2022: primer año del XVIII Convenio, sin incremento previo dentro del período
  2023: 0.025,  // XVIII Convenio (+2,5%)
  2024: 0.020,  // Actualización 2024 BOE-A-2024-7019 (+2,0%)
  2025: 0.040,  // XIX Convenio (+4,0%)
  2026: 0.030,  // XIX Convenio (+3,0%)
  2027: 0.030,  // XIX Convenio (+3,0%) — fuera del rango de análisis de la UI
};

// ---------------------------------------------------------------------------
// ESCALA DE TRIENIOS
// ---------------------------------------------------------------------------
const TRIENIOS = {
  tramo1: { cantidad: 5, porcentaje: 0.05 },
  tramo2: { cantidad: 3, porcentaje: 0.10 },
  tramo3: { cantidad: 1, porcentaje: 0.05 },
};

export const MAX_TRIENIOS =
  TRIENIOS.tramo1.cantidad + TRIENIOS.tramo2.cantidad + TRIENIOS.tramo3.cantidad; // 9

// ---------------------------------------------------------------------------
// ÁREAS
// ---------------------------------------------------------------------------
export const AREAS = [
  { id: 'bpo',              label: 'Área 1 — BPO y Administración Interna',         num: 1, yearMin: 2022 },
  { id: 'cau',              label: 'Área 2 — CAU',                                  num: 2, yearMin: 2022 },
  { id: 'programacion',     label: 'Área 3 — Programación',                         num: 3, yearMin: 2022 },
  { id: 'consultoria',      label: 'Área 4 — Consultoría de Negocio y Tecnológica', num: 4, yearMin: 2022 },
  { id: 'ciberseguridad',   label: 'Área 5 — Ciberseguridad',                       num: 5, yearMin: 2025 },
  { id: 'estudios-mercado', label: 'Área 6 — Estudios de Mercado',                  num: 6, yearMin: 2022 },
];

// ---------------------------------------------------------------------------
// NIVELES POR ÁREA
// ---------------------------------------------------------------------------
const _nivelesStd = [
  { id: 'A-1', sufijo: 'GAN1' },
  { id: 'B-1', sufijo: 'GBN1' },
  { id: 'B-2', sufijo: 'GBN2' },
  { id: 'C-1', sufijo: 'GCN1' },
  { id: 'C-2', sufijo: 'GCN2' },
  { id: 'C-3', sufijo: 'GCN3' },
  { id: 'D-1', sufijo: 'GDN1' },
  { id: 'D-2', sufijo: 'GDN2' },
  { id: 'D-3', sufijo: 'GDN3' },
  { id: 'E-1', sufijo: 'GEN1' },
  { id: 'E-2', sufijo: 'GEN2' },
];

const _nivelesCau = [
  { id: 'A-2', sufijo: 'GAN2' }, // nivel superior en CAU
  { id: 'B-1', sufijo: 'GBN1' },
  { id: 'B-2', sufijo: 'GBN2' },
  { id: 'C-1', sufijo: 'GCN1' },
  { id: 'C-2', sufijo: 'GCN2' },
  { id: 'C-3', sufijo: 'GCN3' },
  { id: 'D-1', sufijo: 'GDN1' },
  { id: 'D-2', sufijo: 'GDN2' },
  { id: 'D-3', sufijo: 'GDN3' },
  { id: 'E-1', sufijo: 'GEN1' },
  { id: 'E-2', sufijo: 'GEN2' },
];

export const NIVELES_POR_AREA = {
  bpo:              _nivelesStd,
  cau:              _nivelesCau,
  programacion:     _nivelesStd,
  consultoria:      _nivelesStd,
  ciberseguridad:   _nivelesStd,
  'estudios-mercado': _nivelesStd,
};

// Lista plana de todos los códigos BOE válidos — fuente de verdad del buscador
export const CODIGOS = AREAS.flatMap(a =>
  (NIVELES_POR_AREA[a.id] ?? []).map(n => ({
    codigo:  `A${a.num}${n.sufijo}`,
    area:    a.id,
    nivel:   n.id,
    yearMin: a.yearMin,
  }))
);

export const YEARS = [2022, 2023, 2024, 2025, 2026];

// ---------------------------------------------------------------------------
// TABLAS SALARIALES
// € anuales brutos.  salarioBase + plusConvenio
// ---------------------------------------------------------------------------
const TABLAS = {

  // -------------------------------------------------------------------------
  // ÁREA 1 — BPO Y ADMINISTRACIÓN INTERNA
  // 2022–2023: todos verificados BOE-A-2023-17238 p.108997
  // 2024:      todos verificados BOE-A-2024-7019 (actualización SMI)
  // 2025–2027: todos verificados BOE-A-2025-7766 p.53633
  // -------------------------------------------------------------------------
  bpo: {
    2022: {
      fuente: 'XVIII Convenio BOE-A-2023-17238 — desde 01/07/2022',
      niveles: {
        'A-1': { salarioBase: 18209.97, plusConvenio:  1931.59 }, // BOE
        'B-1': { salarioBase: 16903.31, plusConvenio:  1522.08 }, // BOE
        'B-2': { salarioBase: 15164.52, plusConvenio:  1496.13 }, // BOE
        'C-1': { salarioBase: 13731.47, plusConvenio:  1774.71 }, // BOE
        'C-2': { salarioBase: 13302.90, plusConvenio:  1967.31 }, // BOE
        'C-3': { salarioBase: 12973.54, plusConvenio:  2065.35 }, // BOE
        'D-1': { salarioBase: 12869.99, plusConvenio:  1942.12 }, // BOE
        'D-2': { salarioBase: 12675.55, plusConvenio:  1914.21 }, // BOE
        'D-3': { salarioBase: 12503.45, plusConvenio:  2005.25 }, // BOE
        'E-1': { salarioBase: 12057.38, plusConvenio:  2399.33 }, // BOE
        'E-2': { salarioBase: 12002.95, plusConvenio:  2417.51 }, // BOE
      },
    },
    2023: {
      fuente: 'XVIII Convenio BOE-A-2023-17238 — desde 01/01/2023',
      niveles: {
        'A-1': { salarioBase: 18461.71, plusConvenio:  2183.33 }, // BOE
        'B-1': { salarioBase: 17133.63, plusConvenio:  1752.40 }, // BOE
        'B-2': { salarioBase: 15372.78, plusConvenio:  1704.39 }, // BOE
        'C-1': { salarioBase: 13925.29, plusConvenio:  1968.53 }, // BOE
        'C-2': { salarioBase: 13493.78, plusConvenio:  2158.19 }, // BOE
        'C-3': { salarioBase: 13251.30, plusConvenio:  2268.70 }, // BOE
        'D-1': { salarioBase: 13276.65, plusConvenio:  2163.36 }, // BOE
        'D-2': { salarioBase: 13206.57, plusConvenio:  2153.44 }, // BOE
        'D-3': { salarioBase: 13033.22, plusConvenio:  2246.78 }, // BOE
        'E-1': { salarioBase: 12553.52, plusConvenio:  2646.48 }, // BOE
        'E-2': { salarioBase: 12462.64, plusConvenio:  2657.36 }, // BOE
      },
    },
    2024: {
      fuente: 'Actualización SMI BOE-A-2024-7019 — desde 01/01/2024',
      niveles: {
        'A-1': { salarioBase: 18668.16, plusConvenio:  2389.78 }, // BOE
        'B-1': { salarioBase: 17322.49, plusConvenio:  1941.26 }, // BOE
        'B-2': { salarioBase: 15543.55, plusConvenio:  1875.16 }, // BOE
        'C-1': { salarioBase: 14279.60, plusConvenio:  2156.40 }, // BOE
        'C-2': { salarioBase: 13984.38, plusConvenio:  2371.62 }, // BOE
        'C-3': { salarioBase: 13784.14, plusConvenio:  2491.86 }, // BOE
        'D-1': { salarioBase: 13811.95, plusConvenio:  2384.05 }, // BOE
        'D-2': { salarioBase: 13742.11, plusConvenio:  2373.89 }, // BOE
        'D-3': { salarioBase: 13568.06, plusConvenio:  2467.94 }, // BOE
        'E-1': { salarioBase: 13075.94, plusConvenio:  2880.06 }, // BOE
        'E-2': { salarioBase: 12984.98, plusConvenio:  2891.02 }, // BOE
      },
    },
    2025: {
      fuente: 'XIX Convenio BOE-A-2025-7766 p.53633',
      niveles: {
        'A-1': { salarioBase: 19414.89, plusConvenio:  2485.37 }, // BOE
        'B-1': { salarioBase: 18015.39, plusConvenio:  2018.91 }, // BOE
        'B-2': { salarioBase: 16165.29, plusConvenio:  1950.17 }, // BOE
        'C-1': { salarioBase: 14887.76, plusConvenio:  2248.24 }, // BOE
        'C-2': { salarioBase: 14582.88, plusConvenio:  2473.12 }, // BOE
        'C-3': { salarioBase: 14376.97, plusConvenio:  2599.03 }, // BOE
        'D-1': { salarioBase: 14408.91, plusConvenio:  2487.09 }, // BOE
        'D-2': { salarioBase: 14339.00, plusConvenio:  2477.00 }, // BOE
        'D-3': { salarioBase: 14160.33, plusConvenio:  2575.67 }, // BOE
        'E-1': { salarioBase: 13649.59, plusConvenio:  3006.41 }, // BOE
        'E-2': { salarioBase: 13557.51, plusConvenio:  3018.49 }, // BOE
      },
    },
    2026: {
      fuente: 'XIX Convenio BOE-A-2025-7766 p.53633 (+3%)',
      niveles: {
        'A-1': { salarioBase: 19997.34, plusConvenio:  2559.93 }, // BOE
        'B-1': { salarioBase: 18555.85, plusConvenio:  2079.48 }, // BOE
        'B-2': { salarioBase: 16650.25, plusConvenio:  2008.68 }, // BOE
        'C-1': { salarioBase: 15334.39, plusConvenio:  2315.69 }, // BOE
        'C-2': { salarioBase: 15020.37, plusConvenio:  2547.31 }, // BOE
        'C-3': { salarioBase: 14808.28, plusConvenio:  2677.00 }, // BOE
        'D-1': { salarioBase: 14841.18, plusConvenio:  2561.70 }, // BOE
        'D-2': { salarioBase: 14769.17, plusConvenio:  2551.31 }, // BOE
        'D-3': { salarioBase: 14585.14, plusConvenio:  2652.94 }, // BOE
        'E-1': { salarioBase: 14059.08, plusConvenio:  3096.60 }, // BOE
        'E-2': { salarioBase: 13964.24, plusConvenio:  3109.04 }, // BOE
      },
    },
    2027: {
      fuente: 'XIX Convenio BOE-A-2025-7766 p.53633 (+3%) — fuera del rango de análisis',
      niveles: {
        'A-1': { salarioBase: 20597.26, plusConvenio:  2636.73 }, // BOE
        'B-1': { salarioBase: 19112.53, plusConvenio:  2141.86 }, // BOE
        'B-2': { salarioBase: 17149.76, plusConvenio:  2068.94 }, // BOE
        'C-1': { salarioBase: 15794.42, plusConvenio:  2385.16 }, // BOE
        'C-2': { salarioBase: 15470.98, plusConvenio:  2623.73 }, // BOE
        'C-3': { salarioBase: 15252.53, plusConvenio:  2757.31 }, // BOE
        'D-1': { salarioBase: 15286.42, plusConvenio:  2638.55 }, // BOE
        'D-2': { salarioBase: 15212.25, plusConvenio:  2627.85 }, // BOE
        'D-3': { salarioBase: 15022.69, plusConvenio:  2732.53 }, // BOE
        'E-1': { salarioBase: 14480.85, plusConvenio:  3189.50 }, // BOE
        'E-2': { salarioBase: 14383.17, plusConvenio:  3202.31 }, // BOE
      },
    },
  },

  // -------------------------------------------------------------------------
  // ÁREA 2 — CAU  (nivel superior = A-2, no A-1)
  // 2022–2023: todos verificados BOE-A-2023-17238 p.108997
  // 2024:      todos verificados BOE-A-2024-7019 (actualización SMI)
  // 2025–2027: todos verificados BOE-A-2025-7766 p.53633
  // -------------------------------------------------------------------------
  cau: {
    2022: {
      fuente: 'XVIII Convenio BOE-A-2023-17238 — desde 01/07/2022',
      niveles: {
        'A-2': { salarioBase: 18369.01, plusConvenio:  2090.63 }, // BOE
        'B-1': { salarioBase: 17061.24, plusConvenio:  1680.01 }, // BOE
        'B-2': { salarioBase: 15334.87, plusConvenio:  1666.48 }, // BOE
        'C-1': { salarioBase: 13955.27, plusConvenio:  1998.51 }, // BOE
        'C-2': { salarioBase: 13501.99, plusConvenio:  2166.40 }, // BOE
        'C-3': { salarioBase: 13148.41, plusConvenio:  2240.22 }, // BOE
        'D-1': { salarioBase: 13021.11, plusConvenio:  2093.24 }, // BOE
        'D-2': { salarioBase: 12803.38, plusConvenio:  2042.04 }, // BOE
        'D-3': { salarioBase: 12605.26, plusConvenio:  2107.06 }, // BOE
        'E-1': { salarioBase: 12119.28, plusConvenio:  2461.23 }, // BOE
        'E-2': { salarioBase: 12017.72, plusConvenio:  2432.28 }, // BOE
      },
    },
    2023: {
      fuente: 'XVIII Convenio BOE-A-2023-17238 — desde 01/01/2023',
      niveles: {
        'A-2': { salarioBase: 18624.75, plusConvenio:  2346.37 }, // BOE
        'B-1': { salarioBase: 17295.51, plusConvenio:  1914.28 }, // BOE
        'B-2': { salarioBase: 15547.39, plusConvenio:  1879.00 }, // BOE
        'C-1': { salarioBase: 14154.69, plusConvenio:  2197.93 }, // BOE
        'C-2': { salarioBase: 13697.85, plusConvenio:  2362.26 }, // BOE
        'C-3': { salarioBase: 13340.76, plusConvenio:  2432.57 }, // BOE
        'D-1': { salarioBase: 13210.04, plusConvenio:  2282.17 }, // BOE
        'D-2': { salarioBase: 13111.39, plusConvenio:  2248.62 }, // BOE
        'D-3': { salarioBase: 12958.67, plusConvenio:  2321.33 }, // BOE
        'E-1': { salarioBase: 12511.42, plusConvenio:  2688.58 }, // BOE
        'E-2': { salarioBase: 12452.63, plusConvenio:  2667.37 }, // BOE
      },
    },
    2024: {
      fuente: 'Actualización SMI BOE-A-2024-7019 — desde 01/01/2024',
      niveles: {
        'A-2': { salarioBase: 18834.46, plusConvenio:  2556.08 }, // BOE
        'B-1': { salarioBase: 17487.60, plusConvenio:  2106.37 }, // BOE
        'B-2': { salarioBase: 15721.65, plusConvenio:  2053.26 }, // BOE
        'C-1': { salarioBase: 14318.22, plusConvenio:  2361.46 }, // BOE
        'C-2': { salarioBase: 13858.45, plusConvenio:  2522.86 }, // BOE
        'C-3': { salarioBase: 13655.56, plusConvenio:  2620.44 }, // BOE
        'D-1': { salarioBase: 13698.58, plusConvenio:  2497.42 }, // BOE
        'D-2': { salarioBase: 13645.42, plusConvenio:  2470.58 }, // BOE
        'D-3': { salarioBase: 13491.09, plusConvenio:  2544.91 }, // BOE
        'E-1': { salarioBase: 13032.86, plusConvenio:  2923.14 }, // BOE
        'E-2': { salarioBase: 12973.87, plusConvenio:  2902.13 }, // BOE
      },
    },
    2025: {
      fuente: 'XIX Convenio BOE-A-2025-7766 p.53633',
      niveles: {
        'A-2': { salarioBase: 19587.84, plusConvenio:  2658.32 }, // BOE
        'B-1': { salarioBase: 18187.10, plusConvenio:  2190.62 }, // BOE
        'B-2': { salarioBase: 16350.52, plusConvenio:  2135.39 }, // BOE
        'C-1': { salarioBase: 14890.95, plusConvenio:  2455.92 }, // BOE
        'C-2': { salarioBase: 14429.24, plusConvenio:  2626.76 }, // BOE
        'C-3': { salarioBase: 14242.86, plusConvenio:  2733.14 }, // BOE
        'D-1': { salarioBase: 14290.64, plusConvenio:  2605.36 }, // BOE
        'D-2': { salarioBase: 14238.11, plusConvenio:  2577.89 }, // BOE
        'D-3': { salarioBase: 14080.00, plusConvenio:  2656.00 }, // BOE
        'E-1': { salarioBase: 13604.62, plusConvenio:  3051.38 }, // BOE
        'E-2': { salarioBase: 13545.91, plusConvenio:  3030.09 }, // BOE
      },
    },
    2026: {
      fuente: 'XIX Convenio BOE-A-2025-7766 p.53633 (+3%)',
      niveles: {
        'A-2': { salarioBase: 20175.48, plusConvenio:  2738.07 }, // BOE
        'B-1': { salarioBase: 18732.71, plusConvenio:  2256.34 }, // BOE
        'B-2': { salarioBase: 16841.04, plusConvenio:  2199.45 }, // BOE
        'C-1': { salarioBase: 15337.68, plusConvenio:  2529.60 }, // BOE
        'C-2': { salarioBase: 14862.12, plusConvenio:  2705.56 }, // BOE
        'C-3': { salarioBase: 14670.15, plusConvenio:  2815.13 }, // BOE
        'D-1': { salarioBase: 14719.36, plusConvenio:  2683.52 }, // BOE
        'D-2': { salarioBase: 14665.25, plusConvenio:  2655.23 }, // BOE
        'D-3': { salarioBase: 14502.40, plusConvenio:  2735.68 }, // BOE
        'E-1': { salarioBase: 14012.76, plusConvenio:  3142.92 }, // BOE
        'E-2': { salarioBase: 13952.29, plusConvenio:  3120.99 }, // BOE
      },
    },
    2027: {
      fuente: 'XIX Convenio BOE-A-2025-7766 p.53633 (+3%) — fuera del rango de análisis',
      niveles: {
        'A-2': { salarioBase: 20780.74, plusConvenio:  2820.21 }, // BOE
        'B-1': { salarioBase: 19294.69, plusConvenio:  2324.03 }, // BOE
        'B-2': { salarioBase: 17346.27, plusConvenio:  2265.43 }, // BOE
        'C-1': { salarioBase: 15797.81, plusConvenio:  2605.49 }, // BOE
        'C-2': { salarioBase: 15307.98, plusConvenio:  2786.73 }, // BOE
        'C-3': { salarioBase: 15110.25, plusConvenio:  2899.58 }, // BOE
        'D-1': { salarioBase: 15160.94, plusConvenio:  2764.03 }, // BOE
        'D-2': { salarioBase: 15105.21, plusConvenio:  2734.89 }, // BOE
        'D-3': { salarioBase: 14937.47, plusConvenio:  2817.75 }, // BOE
        'E-1': { salarioBase: 14433.14, plusConvenio:  3237.21 }, // BOE
        'E-2': { salarioBase: 14370.86, plusConvenio:  3214.62 }, // BOE
      },
    },
  },

  // -------------------------------------------------------------------------
  // ÁREA 3 — PROGRAMACIÓN
  // 2022–2023: todos verificados BOE-A-2023-17238
  // 2024:      todos verificados BOE-A-2024-7019 (actualización SMI)
  // 2025–2027: todos verificados BOE-A-2025-7766
  // -------------------------------------------------------------------------
  programacion: {
    2022: {
      fuente: 'XVIII Convenio BOE-A-2023-17238 — desde 01/07/2022',
      niveles: {
        'A-1': { salarioBase: 25_385.54, plusConvenio:  2_209.13 }, // BOE
        'B-1': { salarioBase: 24_626.28, plusConvenio:  2_141.42 }, // BOE
        'B-2': { salarioBase: 23_888.43, plusConvenio:  2_077.26 }, // BOE
        'C-1': { salarioBase: 23_209.00, plusConvenio:  2_170.35 }, // BOE
        'C-2': { salarioBase: 21_691.73, plusConvenio:  2_038.67 }, // BOE
        'C-3': { salarioBase: 19_566.15, plusConvenio:  1_957.67 }, // BOE
        'D-1': { salarioBase: 16_549.95, plusConvenio:  1_697.47 }, // BOE
        'D-2': { salarioBase: 15_539.98, plusConvenio:  1_351.30 }, // BOE
        'D-3': { salarioBase: 15_137.47, plusConvenio:  1_419.08 }, // BOE
        'E-1': { salarioBase: 14_875.89, plusConvenio:  1_460.42 }, // BOE
        'E-2': { salarioBase: 13_494.00, plusConvenio:  1_156.00 }, // BOE
      },
    },
    2023: {
      fuente: 'XVIII Convenio BOE-A-2023-17238 — desde 01/01/2023',
      niveles: {
        'A-1': { salarioBase: 26_020.18, plusConvenio:  2_264.36 }, // BOE
        'B-1': { salarioBase: 25_241.94, plusConvenio:  2_194.96 }, // BOE
        'B-2': { salarioBase: 24_485.64, plusConvenio:  2_129.19 }, // BOE
        'C-1': { salarioBase: 23_942.98, plusConvenio:  2_070.86 }, // BOE
        'C-2': { salarioBase: 22_387.77, plusConvenio:  1_935.89 }, // BOE
        'C-3': { salarioBase: 20_260.30, plusConvenio:  1_801.61 }, // BOE
        'D-1': { salarioBase: 17_168.70, plusConvenio:  1_534.91 }, // BOE
        'D-2': { salarioBase: 15_928.48, plusConvenio:  1_385.08 }, // BOE
        'D-3': { salarioBase: 15_618.41, plusConvenio:  1_352.06 }, // BOE
        'E-1': { salarioBase: 15_381.04, plusConvenio:  1_363.68 }, // BOE
        'E-2': { salarioBase: 13_926.91, plusConvenio:  1_193.09 }, // BOE
      },
    },
    2024: {
      fuente: 'Actualización SMI BOE-A-2024-7019 — desde 01/01/2024',
      niveles: {
        'A-1': { salarioBase: 26_540.58, plusConvenio:  2_309.65 }, // BOE
        'B-1': { salarioBase: 25_746.78, plusConvenio:  2_238.86 }, // BOE
        'B-2': { salarioBase: 24_975.35, plusConvenio:  2_171.77 }, // BOE
        'C-1': { salarioBase: 24_421.84, plusConvenio:  2_112.28 }, // BOE
        'C-2': { salarioBase: 22_835.53, plusConvenio:  1_974.61 }, // BOE
        'C-3': { salarioBase: 20_665.51, plusConvenio:  1_837.64 }, // BOE
        'D-1': { salarioBase: 17_512.07, plusConvenio:  1_565.61 }, // BOE
        'D-2': { salarioBase: 16_247.05, plusConvenio:  1_412.78 }, // BOE
        'D-3': { salarioBase: 15_930.78, plusConvenio:  1_379.10 }, // BOE
        'E-1': { salarioBase: 15_688.66, plusConvenio:  1_390.95 }, // BOE
        'E-2': { salarioBase: 14_623.38, plusConvenio:  1_252.62 }, // BOE
      },
    },
    2025: {
      fuente: 'XIX Convenio BOE-A-2025-7766 — desde 01/01/2025',
      niveles: {
        'A-1': { salarioBase: 27_602.20, plusConvenio:  2_402.04 }, // BOE
        'B-1': { salarioBase: 26_776.65, plusConvenio:  2_328.41 }, // BOE
        'B-2': { salarioBase: 25_974.36, plusConvenio:  2_258.64 }, // BOE
        'C-1': { salarioBase: 25_398.71, plusConvenio:  2_196.77 }, // BOE
        'C-2': { salarioBase: 23_748.95, plusConvenio:  2_053.59 }, // BOE
        'C-3': { salarioBase: 21_492.13, plusConvenio:  1_911.15 }, // BOE
        'D-1': { salarioBase: 18_212.55, plusConvenio:  1_628.23 }, // BOE
        'D-2': { salarioBase: 16_896.93, plusConvenio:  1_469.29 }, // BOE
        'D-3': { salarioBase: 16_568.01, plusConvenio:  1_434.26 }, // BOE
        'E-1': { salarioBase: 16_316.21, plusConvenio:  1_446.59 }, // BOE
        'E-2': { salarioBase: 15_935.03, plusConvenio:  1_364.97 }, // BOE
      },
    },
    2026: {
      fuente: 'XIX Convenio BOE-A-2025-7766 — desde 01/01/2026 (+3%)',
      niveles: {
        'A-1': { salarioBase: 28_430.27, plusConvenio:  2_474.10 }, // BOE
        'B-1': { salarioBase: 27_579.95, plusConvenio:  2_398.26 }, // BOE
        'B-2': { salarioBase: 26_753.59, plusConvenio:  2_326.40 }, // BOE
        'C-1': { salarioBase: 26_160.67, plusConvenio:  2_262.67 }, // BOE
        'C-2': { salarioBase: 24_461.42, plusConvenio:  2_115.20 }, // BOE
        'C-3': { salarioBase: 22_136.89, plusConvenio:  1_968.48 }, // BOE
        'D-1': { salarioBase: 18_758.93, plusConvenio:  1_677.08 }, // BOE
        'D-2': { salarioBase: 17_403.84, plusConvenio:  1_513.37 }, // BOE
        'D-3': { salarioBase: 17_065.05, plusConvenio:  1_477.29 }, // BOE
        'E-1': { salarioBase: 16_805.70, plusConvenio:  1_489.99 }, // BOE
        'E-2': { salarioBase: 16_413.08, plusConvenio:  1_405.92 }, // BOE
      },
    },
    2027: {
      fuente: 'XIX Convenio BOE-A-2025-7766 (+3%) — fuera del rango de análisis',
      niveles: {
        'A-1': { salarioBase: 29283.18, plusConvenio:  2548.32 }, // BOE
        'B-1': { salarioBase: 28407.35, plusConvenio:  2470.21 }, // BOE
        'B-2': { salarioBase: 27556.20, plusConvenio:  2396.19 }, // BOE
        'C-1': { salarioBase: 26945.49, plusConvenio:  2330.55 }, // BOE
        'C-2': { salarioBase: 25195.26, plusConvenio:  2178.66 }, // BOE
        'C-3': { salarioBase: 22801.00, plusConvenio:  2027.53 }, // BOE
        'D-1': { salarioBase: 19321.70, plusConvenio:  1727.39 }, // BOE
        'D-2': { salarioBase: 17925.96, plusConvenio:  1558.77 }, // BOE
        'D-3': { salarioBase: 17577.00, plusConvenio:  1521.61 }, // BOE
        'E-1': { salarioBase: 17309.87, plusConvenio:  1534.69 }, // BOE
        'E-2': { salarioBase: 16905.47, plusConvenio:  1448.10 }, // BOE
      },
    },
  },

  // -------------------------------------------------------------------------
  // ÁREA 4 — CONSULTORÍA DE NEGOCIO Y TECNOLÓGICA
  // 2022–2023: todos verificados BOE-A-2023-17238 p.108998
  // 2024:      todos verificados BOE-A-2024-7019 (actualización SMI)
  // 2025–2027: todos verificados BOE-A-2025-7766 p.53634
  // -------------------------------------------------------------------------
  consultoria: {
    2022: {
      fuente: 'XVIII Convenio BOE-A-2023-17238 — desde 01/07/2022',
      niveles: {
        'A-1': { salarioBase: 25435.54, plusConvenio:  2263.49 }, // BOE
        'B-1': { salarioBase: 24793.94, plusConvenio:  2754.88 }, // BOE
        'B-2': { salarioBase: 24068.12, plusConvenio:  2674.24 }, // BOE
        'C-1': { salarioBase: 23281.51, plusConvenio:  2586.83 }, // BOE
        'C-2': { salarioBase: 21759.43, plusConvenio:  2417.71 }, // BOE
        'C-3': { salarioBase: 19615.69, plusConvenio:  2179.52 }, // BOE
        'D-1': { salarioBase: 16624.07, plusConvenio:  1847.12 }, // BOE
        'D-2': { salarioBase: 15653.96, plusConvenio:  1739.33 }, // BOE
        'D-3': { salarioBase: 15212.63, plusConvenio:  1690.29 }, // BOE
        'E-1': { salarioBase: 14817.89, plusConvenio:  1618.17 }, // BOE
        'E-2': { salarioBase: 13500.00, plusConvenio:  1500.00 }, // BOE
      },
    },
    2023: {
      fuente: 'XVIII Convenio BOE-A-2023-17238 — desde 01/01/2023',
      niveles: {
        'A-1': { salarioBase: 26071.43, plusConvenio:  2320.08 }, // BOE
        'B-1': { salarioBase: 25413.79, plusConvenio:  2823.75 }, // BOE
        'B-2': { salarioBase: 24669.82, plusConvenio:  2741.10 }, // BOE
        'C-1': { salarioBase: 23863.55, plusConvenio:  2651.50 }, // BOE
        'C-2': { salarioBase: 22303.42, plusConvenio:  2478.15 }, // BOE
        'C-3': { salarioBase: 20106.08, plusConvenio:  2234.01 }, // BOE
        'D-1': { salarioBase: 17039.67, plusConvenio:  1893.30 }, // BOE
        'D-2': { salarioBase: 16045.31, plusConvenio:  1782.81 }, // BOE
        'D-3': { salarioBase: 15592.95, plusConvenio:  1732.55 }, // BOE
        'E-1': { salarioBase: 15188.34, plusConvenio:  1658.62 }, // BOE
        'E-2': { salarioBase: 14400.00, plusConvenio:  1600.00 }, // BOE
      },
    },
    2024: {
      fuente: 'Actualización SMI BOE-A-2024-7019 — desde 01/01/2024',
      niveles: {
        'A-1': { salarioBase: 26592.86, plusConvenio:  2366.48 }, // BOE
        'B-1': { salarioBase: 25922.07, plusConvenio:  2880.23 }, // BOE
        'B-2': { salarioBase: 25163.22, plusConvenio:  2795.92 }, // BOE
        'C-1': { salarioBase: 24340.82, plusConvenio:  2704.53 }, // BOE
        'C-2': { salarioBase: 22749.49, plusConvenio:  2527.71 }, // BOE
        'C-3': { salarioBase: 20508.20, plusConvenio:  2278.69 }, // BOE
        'D-1': { salarioBase: 17380.46, plusConvenio:  1931.17 }, // BOE
        'D-2': { salarioBase: 16366.22, plusConvenio:  1818.47 }, // BOE
        'D-3': { salarioBase: 15904.81, plusConvenio:  1767.20 }, // BOE
        'E-1': { salarioBase: 15492.11, plusConvenio:  1691.79 }, // BOE
        'E-2': { salarioBase: 15300.00, plusConvenio:  1700.00 }, // BOE
      },
    },
    2025: {
      fuente: 'XIX Convenio BOE-A-2025-7766 p.53634',
      niveles: {
        'A-1': { salarioBase: 27656.57, plusConvenio:  2461.14 }, // BOE
        'B-1': { salarioBase: 26958.95, plusConvenio:  2995.44 }, // BOE
        'B-2': { salarioBase: 26169.75, plusConvenio:  2907.76 }, // BOE
        'C-1': { salarioBase: 25314.45, plusConvenio:  2812.71 }, // BOE
        'C-2': { salarioBase: 23659.47, plusConvenio:  2628.82 }, // BOE
        'C-3': { salarioBase: 21328.53, plusConvenio:  2369.84 }, // BOE
        'D-1': { salarioBase: 18075.68, plusConvenio:  2008.42 }, // BOE
        'D-2': { salarioBase: 17020.87, plusConvenio:  1891.21 }, // BOE
        'D-3': { salarioBase: 16541.00, plusConvenio:  1837.89 }, // BOE
        'E-1': { salarioBase: 16111.79, plusConvenio:  1759.46 }, // BOE
        'E-2': { salarioBase: 15912.00, plusConvenio:  1768.00 }, // BOE
      },
    },
    2026: {
      fuente: 'XIX Convenio BOE-A-2025-7766 p.53634 (+3%)',
      niveles: {
        'A-1': { salarioBase: 28486.27, plusConvenio:  2534.97 }, // BOE
        'B-1': { salarioBase: 27767.72, plusConvenio:  3085.30 }, // BOE
        'B-2': { salarioBase: 26954.84, plusConvenio:  2994.99 }, // BOE
        'C-1': { salarioBase: 26073.88, plusConvenio:  2897.09 }, // BOE
        'C-2': { salarioBase: 24369.25, plusConvenio:  2707.68 }, // BOE
        'C-3': { salarioBase: 21968.39, plusConvenio:  2440.94 }, // BOE
        'D-1': { salarioBase: 18617.95, plusConvenio:  2068.67 }, // BOE
        'D-2': { salarioBase: 17531.50, plusConvenio:  1947.95 }, // BOE
        'D-3': { salarioBase: 17037.23, plusConvenio:  1893.03 }, // BOE
        'E-1': { salarioBase: 16595.14, plusConvenio:  1812.24 }, // BOE
        'E-2': { salarioBase: 16389.36, plusConvenio:  1821.04 }, // BOE
      },
    },
    2027: {
      fuente: 'XIX Convenio BOE-A-2025-7766 p.53634 (+3%) — fuera del rango de análisis',
      niveles: {
        'A-1': { salarioBase: 29340.86, plusConvenio:  2611.02 }, // BOE
        'B-1': { salarioBase: 28600.75, plusConvenio:  3177.86 }, // BOE
        'B-2': { salarioBase: 27763.49, plusConvenio:  3084.84 }, // BOE
        'C-1': { salarioBase: 26856.10, plusConvenio:  2984.00 }, // BOE
        'C-2': { salarioBase: 25100.33, plusConvenio:  2788.91 }, // BOE
        'C-3': { salarioBase: 22627.44, plusConvenio:  2514.17 }, // BOE
        'D-1': { salarioBase: 19176.49, plusConvenio:  2130.73 }, // BOE
        'D-2': { salarioBase: 18057.45, plusConvenio:  2006.39 }, // BOE
        'D-3': { salarioBase: 17548.35, plusConvenio:  1949.82 }, // BOE
        'E-1': { salarioBase: 17092.99, plusConvenio:  1866.61 }, // BOE
        'E-2': { salarioBase: 16881.04, plusConvenio:  1875.67 }, // BOE
      },
    },
  },

  // -------------------------------------------------------------------------
  // ÁREA 5 — CIBERSEGURIDAD (solo desde 2025)
  // 2025–2027: todos verificados BOE-A-2025-7766 p.53634
  // -------------------------------------------------------------------------
  ciberseguridad: {
    2025: {
      fuente: 'XIX Convenio BOE-A-2025-7766 p.53634',
      niveles: {
        'A-1': { salarioBase: 31171.83, plusConvenio:  3463.54 }, // BOE
        'B-1': { salarioBase: 31002.80, plusConvenio:  3444.76 }, // BOE
        'B-2': { salarioBase: 30095.23, plusConvenio:  3343.91 }, // BOE
        'C-1': { salarioBase: 29111.61, plusConvenio:  3234.62 }, // BOE
        'C-2': { salarioBase: 27208.38, plusConvenio:  3023.15 }, // BOE
        'C-3': { salarioBase: 24527.82, plusConvenio:  2725.31 }, // BOE
        'D-1': { salarioBase: 20425.53, plusConvenio:  2269.50 }, // BOE
        'D-2': { salarioBase: 19233.59, plusConvenio:  2137.07 }, // BOE
        'D-3': { salarioBase: 18691.34, plusConvenio:  2076.82 }, // BOE
        'E-1': { salarioBase: 17692.54, plusConvenio:  1965.84 }, // BOE
        'E-2': { salarioBase: 17503.20, plusConvenio:  1944.80 }, // BOE
      },
    },
    2026: {
      fuente: 'XIX Convenio BOE-A-2025-7766 p.53634 (+3%)',
      niveles: {
        'A-1': { salarioBase: 32106.98, plusConvenio:  3567.45 }, // BOE
        'B-1': { salarioBase: 31932.88, plusConvenio:  3548.10 }, // BOE
        'B-2': { salarioBase: 30998.09, plusConvenio:  3444.23 }, // BOE
        'C-1': { salarioBase: 29984.96, plusConvenio:  3331.66 }, // BOE
        'C-2': { salarioBase: 28024.63, plusConvenio:  3113.84 }, // BOE
        'C-3': { salarioBase: 25263.65, plusConvenio:  2807.07 }, // BOE
        'D-1': { salarioBase: 21038.30, plusConvenio:  2337.59 }, // BOE
        'D-2': { salarioBase: 19810.60, plusConvenio:  2201.18 }, // BOE
        'D-3': { salarioBase: 19252.08, plusConvenio:  2139.12 }, // BOE
        'E-1': { salarioBase: 18223.32, plusConvenio:  2024.82 }, // BOE
        'E-2': { salarioBase: 18028.30, plusConvenio:  2003.14 }, // BOE
      },
    },
    2027: {
      fuente: 'XIX Convenio BOE-A-2025-7766 p.53634 (+3%) — fuera del rango de análisis',
      niveles: {
        'A-1': { salarioBase: 33070.19, plusConvenio:  3674.47 }, // BOE
        'B-1': { salarioBase: 32890.87, plusConvenio:  3654.54 }, // BOE
        'B-2': { salarioBase: 31928.03, plusConvenio:  3547.56 }, // BOE
        'C-1': { salarioBase: 30884.51, plusConvenio:  3431.61 }, // BOE
        'C-2': { salarioBase: 28865.37, plusConvenio:  3207.26 }, // BOE
        'C-3': { salarioBase: 26021.56, plusConvenio:  2891.28 }, // BOE
        'D-1': { salarioBase: 21669.45, plusConvenio:  2407.72 }, // BOE
        'D-2': { salarioBase: 20404.92, plusConvenio:  2267.22 }, // BOE
        'D-3': { salarioBase: 19829.64, plusConvenio:  2203.29 }, // BOE
        'E-1': { salarioBase: 18770.02, plusConvenio:  2085.56 }, // BOE
        'E-2': { salarioBase: 18569.15, plusConvenio:  2063.23 }, // BOE
      },
    },
  },

  // -------------------------------------------------------------------------
  // ÁREA 6 — ESTUDIOS DE MERCADO
  // 2022–2023: todos verificados BOE-A-2023-17238 p.108997
  // 2024:      todos verificados BOE-A-2024-7019 (actualización SMI)
  // 2025–2027: todos verificados BOE-A-2025-7766 p.53633
  // Idéntica a Área 1 (BPO) salvo E-2, que difiere en todos los años
  // -------------------------------------------------------------------------
  'estudios-mercado': {
    2022: {
      fuente: 'XVIII Convenio BOE-A-2023-17238 — desde 01/07/2022',
      niveles: {
        'A-1': { salarioBase: 18209.97, plusConvenio:  1931.59 }, // BOE
        'B-1': { salarioBase: 16903.31, plusConvenio:  1522.08 }, // BOE
        'B-2': { salarioBase: 15164.52, plusConvenio:  1496.13 }, // BOE
        'C-1': { salarioBase: 13731.47, plusConvenio:  1774.71 }, // BOE
        'C-2': { salarioBase: 13302.90, plusConvenio:  1967.31 }, // BOE
        'C-3': { salarioBase: 12973.54, plusConvenio:  2065.35 }, // BOE
        'D-1': { salarioBase: 12869.99, plusConvenio:  1942.12 }, // BOE
        'D-2': { salarioBase: 12675.55, plusConvenio:  1914.21 }, // BOE
        'D-3': { salarioBase: 12503.45, plusConvenio:  2005.25 }, // BOE
        'E-1': { salarioBase: 12057.38, plusConvenio:  2399.33 }, // BOE
        'E-2': { salarioBase: 11843.46, plusConvenio:  2436.54 }, // BOE (difiere de Área 1)
      },
    },
    2023: {
      fuente: 'XVIII Convenio BOE-A-2023-17238 — desde 01/01/2023',
      niveles: {
        'A-1': { salarioBase: 18461.71, plusConvenio:  2183.33 }, // BOE
        'B-1': { salarioBase: 17133.63, plusConvenio:  1752.40 }, // BOE
        'B-2': { salarioBase: 15372.78, plusConvenio:  1704.39 }, // BOE
        'C-1': { salarioBase: 13925.29, plusConvenio:  1968.53 }, // BOE
        'C-2': { salarioBase: 13493.78, plusConvenio:  2158.19 }, // BOE
        'C-3': { salarioBase: 13251.30, plusConvenio:  2268.70 }, // BOE
        'D-1': { salarioBase: 13276.65, plusConvenio:  2163.36 }, // BOE
        'D-2': { salarioBase: 13206.57, plusConvenio:  2153.44 }, // BOE
        'D-3': { salarioBase: 13033.22, plusConvenio:  2246.78 }, // BOE
        'E-1': { salarioBase: 12553.52, plusConvenio:  2646.48 }, // BOE
        'E-2': { salarioBase: 12472.42, plusConvenio:  2647.58 }, // BOE (difiere de Área 1)
      },
    },
    2024: {
      fuente: 'Actualización SMI BOE-A-2024-7019 — desde 01/01/2024',
      niveles: {
        'A-1': { salarioBase: 18668.16, plusConvenio:  2389.78 }, // BOE
        'B-1': { salarioBase: 17322.49, plusConvenio:  1941.26 }, // BOE
        'B-2': { salarioBase: 15543.55, plusConvenio:  1875.16 }, // BOE
        'C-1': { salarioBase: 14279.60, plusConvenio:  2156.40 }, // BOE
        'C-2': { salarioBase: 13984.38, plusConvenio:  2371.62 }, // BOE
        'C-3': { salarioBase: 13784.14, plusConvenio:  2491.86 }, // BOE
        'D-1': { salarioBase: 13811.95, plusConvenio:  2384.05 }, // BOE
        'D-2': { salarioBase: 13742.11, plusConvenio:  2373.89 }, // BOE
        'D-3': { salarioBase: 13568.06, plusConvenio:  2467.94 }, // BOE
        'E-1': { salarioBase: 13075.94, plusConvenio:  2880.06 }, // BOE
        'E-2': { salarioBase: 12983.39, plusConvenio:  2892.61 }, // BOE (difiere de Área 1)
      },
    },
    2025: {
      fuente: 'XIX Convenio BOE-A-2025-7766 p.53633',
      niveles: {
        'A-1': { salarioBase: 19414.89, plusConvenio:  2485.37 }, // BOE
        'B-1': { salarioBase: 18015.39, plusConvenio:  2018.91 }, // BOE
        'B-2': { salarioBase: 16165.29, plusConvenio:  1950.17 }, // BOE
        'C-1': { salarioBase: 14887.76, plusConvenio:  2248.24 }, // BOE
        'C-2': { salarioBase: 14582.88, plusConvenio:  2473.12 }, // BOE
        'C-3': { salarioBase: 14376.97, plusConvenio:  2599.03 }, // BOE
        'D-1': { salarioBase: 14408.91, plusConvenio:  2487.09 }, // BOE
        'D-2': { salarioBase: 14339.00, plusConvenio:  2477.00 }, // BOE
        'D-3': { salarioBase: 14160.33, plusConvenio:  2575.67 }, // BOE
        'E-1': { salarioBase: 13649.59, plusConvenio:  3006.41 }, // BOE
        'E-2': { salarioBase: 13555.85, plusConvenio:  3020.15 }, // BOE (difiere de Área 1)
      },
    },
    2026: {
      fuente: 'XIX Convenio BOE-A-2025-7766 p.53633 (+3%)',
      niveles: {
        'A-1': { salarioBase: 19997.34, plusConvenio:  2559.93 }, // BOE
        'B-1': { salarioBase: 18555.85, plusConvenio:  2079.48 }, // BOE
        'B-2': { salarioBase: 16650.25, plusConvenio:  2008.68 }, // BOE
        'C-1': { salarioBase: 15334.39, plusConvenio:  2315.69 }, // BOE
        'C-2': { salarioBase: 15020.37, plusConvenio:  2547.31 }, // BOE
        'C-3': { salarioBase: 14808.28, plusConvenio:  2677.00 }, // BOE
        'D-1': { salarioBase: 14841.18, plusConvenio:  2561.70 }, // BOE
        'D-2': { salarioBase: 14769.17, plusConvenio:  2551.31 }, // BOE
        'D-3': { salarioBase: 14585.14, plusConvenio:  2652.94 }, // BOE
        'E-1': { salarioBase: 14059.08, plusConvenio:  3096.60 }, // BOE
        'E-2': { salarioBase: 13962.53, plusConvenio:  3110.75 }, // BOE (difiere de Área 1)
      },
    },
    2027: {
      fuente: 'XIX Convenio BOE-A-2025-7766 p.53633 (+3%) — fuera del rango de análisis',
      niveles: {
        'A-1': { salarioBase: 20597.26, plusConvenio:  2636.73 }, // BOE
        'B-1': { salarioBase: 19112.53, plusConvenio:  2141.86 }, // BOE
        'B-2': { salarioBase: 17149.76, plusConvenio:  2068.94 }, // BOE
        'C-1': { salarioBase: 15794.42, plusConvenio:  2385.16 }, // BOE
        'C-2': { salarioBase: 15470.98, plusConvenio:  2623.73 }, // BOE
        'C-3': { salarioBase: 15252.53, plusConvenio:  2757.31 }, // BOE
        'D-1': { salarioBase: 15286.42, plusConvenio:  2638.55 }, // BOE
        'D-2': { salarioBase: 15212.25, plusConvenio:  2627.85 }, // BOE
        'D-3': { salarioBase: 15022.69, plusConvenio:  2732.53 }, // BOE
        'E-1': { salarioBase: 14480.85, plusConvenio:  3189.50 }, // BOE
        'E-2': { salarioBase: 14381.41, plusConvenio:  3204.07 }, // BOE (difiere de Área 1)
      },
    },
  },

};

// ---------------------------------------------------------------------------
// FUNCIONES DE CÁLCULO
// ---------------------------------------------------------------------------

/**
 * Devuelve salarioBase, plusConvenio y total para un nivel/año/área.
 * Retorna null si el área, año o nivel no existen.
 */
export function getTablaSalarial(nivel, year, area = 'programacion') {
  const areaTablas = TABLAS[area];
  if (!areaTablas) return null;
  const tabla = areaTablas[year];
  if (!tabla?.niveles?.[nivel]) return null;
  const { salarioBase, plusConvenio } = tabla.niveles[nivel];
  return { salarioBase, plusConvenio, total: salarioBase + plusConvenio };
}

/**
 * Número de trienios completos a 31/12 del año indicado.
 */
function trieniosCompletados(fechaAlta, year) {
  const inicio = new Date(fechaAlta);
  const fin    = new Date(year, 11, 31);
  const meses  = (fin.getFullYear() - inicio.getFullYear()) * 12
               + (fin.getMonth()    - inicio.getMonth());
  return Math.min(MAX_TRIENIOS, Math.max(0, Math.floor(meses / 36)));
}

/**
 * Importe anual de antigüedad según la escala de trienios del convenio.
 * Base: salario base del nivel/año correspondiente.
 */
function importeAntiguedad(nivel, year, nTrienios, area = 'programacion') {
  if (nTrienios <= 0) return 0;
  const t = getTablaSalarial(nivel, year, area);
  if (!t) return 0;

  const sb = t.salarioBase;
  const { tramo1, tramo2, tramo3 } = TRIENIOS;
  let total = 0;
  let r = nTrienios;

  const t1 = Math.min(r, tramo1.cantidad);
  total += sb * tramo1.porcentaje * t1;
  r -= t1;

  if (r > 0) {
    const t2 = Math.min(r, tramo2.cantidad);
    total += sb * tramo2.porcentaje * t2;
    r -= t2;
  }

  if (r > 0) {
    total += sb * tramo3.porcentaje * Math.min(r, tramo3.cantidad);
  }

  return total;
}

/**
 * Aplica el IPC acumulado a un salario desde yearDesde hasta yearHasta (exclusive).
 */
function aplicarIPC(salario, yearDesde, yearHasta) {
  let s = salario;
  for (let y = yearDesde; y < yearHasta; y++) {
    if (IPC[y]) s *= (1 + IPC[y].valor);
  }
  return s;
}

/**
 * Salario teórico de convenio sin absorción: total convenio + antigüedad.
 */
function salarioTeoricoConvenio(nivel, year, fechaAlta, area = 'programacion') {
  const t = getTablaSalarial(nivel, year, area);
  if (!t) return null;
  const trienos = trieniosCompletados(fechaAlta, year);
  const antig   = importeAntiguedad(nivel, year, trienos, area);
  return {
    salarioBase:  t.salarioBase,
    plusConvenio: t.plusConvenio,
    trienos,
    antig,
    total: t.total + antig,
  };
}

/**
 * Genera la serie de datos año a año para el gráfico.
 */
export function generarSerie({
  yearInicio,
  yearFin = 2026,
  area = 'programacion',
  nivelInicio,
  salarioInicio,
  fechaAlta,
  modificaciones = [],
}) {
  const mods = [...modificaciones].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.mes - b.mes
  );

  const years = YEARS.filter(y => y >= yearInicio && y <= yearFin);
  let nivelActual   = nivelInicio;
  let areaActual    = area;
  let salarioActual = salarioInicio;

  // Trienios que el trabajador ya tenía ANTES del período (hasta 31/12 del año previo).
  // Sirve para detectar trienio nuevo en el año 1 del análisis.
  const trieniosPrePeriodo = trieniosCompletados(fechaAlta, yearInicio - 1);

  // El complemento personal captura solo la diferencia entre salarioInicio y la tabla
  // base del convenio (sin trienios). Los trienios — tanto los previos como los nuevos —
  // son absorbibles independientemente, por eso no forman parte del complemento.
  const tablaInicio = getTablaSalarial(nivelInicio, yearInicio, area);
  let complementoPersonal = tablaInicio
    ? salarioInicio - tablaInicio.total
    : 0;

  return years.map(year => {
    mods
      .filter(m => m.year === year)
      .forEach(m => {
        if (m.tipo === 'nivel') {
          nivelActual = m.valor;
          if (m.area) areaActual = m.area;
        }
        if (m.tipo === 'salario') {
          salarioActual = m.valor;
          const tablasMod = getTablaSalarial(nivelActual, year, areaActual);
          complementoPersonal = tablasMod ? m.valor - tablasMod.total : 0;
        }
      });

    // Auto-promoción E-2 → E-1 (artículo XVIII Convenio, desde 01/01/2023).
    // A los 3 años en E-2 el trabajador pasa automáticamente a E-1.
    let e2Promovido = false;
    if (nivelActual === 'E-2' && year >= 2023 && trieniosCompletados(fechaAlta, year) >= 1) {
      nivelActual  = 'E-1';
      e2Promovido  = true;
    }

    const tablas = getTablaSalarial(nivelActual, year, areaActual);
    const teo    = salarioTeoricoConvenio(nivelActual, year, fechaAlta, areaActual);
    const poder  = aplicarIPC(salarioInicio, yearInicio - 1, year);

    const trieniosActuales   = teo?.trienos ?? 0;
    const trieniosAnteriores = year > yearInicio
      ? trieniosCompletados(fechaAlta, year - 1)
      : trieniosPrePeriodo;
    const trienioNuevo = trieniosActuales > trieniosAnteriores;
    const importeTrienioNuevo = trienioNuevo
      ? importeAntiguedad(nivelActual, year, trieniosActuales, areaActual)
        - importeAntiguedad(nivelActual, year, trieniosActuales - 1, areaActual)
      : 0;

    // Solo los trienios ganados DURANTE el período contribuyen a perdidaAbsorcion.
    // Los trienios previos al período ya estaban absorbidos antes y distorsionan el mensaje.
    const importeAntigPeriodo = importeAntiguedad(nivelActual, year, trieniosActuales, areaActual)
                              - importeAntiguedad(nivelActual, year, trieniosPrePeriodo, areaActual);

    const salarioSinAbsorcion = tablas
      ? complementoPersonal + tablas.total + importeAntigPeriodo
      : null;

    return {
      year,
      e2Promovido,
      areaEfectiva:        areaActual,
      nivelEfectivo:       nivelActual,
      salarioReal:         salarioActual,
      salarioConvenio:     tablas?.total ?? null,
      salarioSinAbsorcion,
      salarioPoder:        poder,
      perdidaAbsorcion:    salarioSinAbsorcion ? Math.max(0, salarioSinAbsorcion - salarioActual) : 0,
      perdidaPoder:        Math.max(0, poder - salarioActual),
      trieniosActuales,
      trienioNuevo,
      importeTrienioNuevo,
      ipc:                 IPC[year - 1] ?? null,
      desglose:            teo
        ? {
            salarioBase:  teo.salarioBase,
            plusConvenio: teo.plusConvenio,
            trienos:      teo.trienos,
            antig:        teo.antig,          // total trienios (para columna de antigüedad)
            antigPeriodo: importeAntigPeriodo, // solo período (para cálculo de absorción)
          }
        : null,
    };
  });
}

/**
 * Suma las pérdidas acumuladas de toda la serie.
 */
export function calcularAcumulados(serie) {
  return serie.reduce(
    (acc, p) => ({
      perdidaAbsorcion: acc.perdidaAbsorcion + p.perdidaAbsorcion,
      perdidaPoder:     acc.perdidaPoder     + p.perdidaPoder,
    }),
    { perdidaAbsorcion: 0, perdidaPoder: 0 }
  );
}
