# SalariosTic.org

Calculadora de pérdida salarial en el secto TIC.
El objetivo del proyecto es visualizar el impacto negativo de la cláusula
de absorción del artículo 7 del convenio y la pérdida de poder adquisitivo frente al IPC.

---

## Estructura del proyecto

```
/
├── index.html          Solo HTML semántico. Un <script type="module"> arranca todo.
├── css/
│   └── styles.css      Toda la presentación. Variables CSS en :root.
├── js/
│   ├── data.js         Datos del convenio y cálculos puros. Sin referencias al DOM.
│   └── app.js          Estado, eventos, renders. Importa de data.js.
└── tests/
    └── data.test.js    Tests unitarios de data.js con Vitest (npm test).
```

Sin frameworks, sin bundler. ES modules nativos. Vitest como única dev dependency.
Publicación en GitHub Pages. Desarrollo local con Live Server (VSCode).

---

## Decisiones de diseño ya tomadas — no revertir sin consenso

- **Sin librerías de gráficos.** El gráfico es canvas 2D nativo (~80 líneas en app.js).
- **Sin frameworks JS.** Vanilla JS con ES modules.
- **Sin backend ni base de datos.** SPA estática pura.
- **data.js no toca el DOM** bajo ningún concepto. Es lógica de negocio pura.
- **app.js no contiene datos del convenio** ni cálculos de negocio. Solo UI y estado.
- **Rango de análisis: 2022–2026.** 2027 excluido de la UI deliberadamente (datos son previsión),
  pero las tablas salariales de 2027 sí están en data.js (fuente de verdad) por si se amplía el rango.
  Los años 2020-2021 (ultraactividad del XVII Convenio) también quedan fuera para no
  complicar el modelo con la nomenclatura del XVII.
- **`salarioInicio` es el salario previo al período**, es decir, el salario de 2021.
  En consecuencia, en 2022 ya existe pérdida de poder adquisitivo (IPC 2021) y los
  trienios presentes en 2022 ya están siendo absorbidos. Ver sección "Modelo de cálculo".
- **Todas las 6 áreas del XIX Convenio incluidas.** IDs descriptivos en código (no numéricos)
  porque el Área 5 cambió de "Estudios de Mercado" (XVIII) a "Ciberseguridad" (XIX).
- **Ciberseguridad solo desde 2025.** Validación en UI: si el usuario selecciona
  Ciberseguridad con yearInicio < 2025, mostrar advertencia y bloquear el cálculo.
- **Tooltip de tabla por columna** — implementado con div#tabla-tooltip position:fixed,
  escucha mousemove en tbody (NO en renderTabla, solo en bindEventos).
- **Nivel de convenio como combobox único** — reemplaza los selectores dobles de área+nivel.
  El usuario escribe o busca el código BOE (e.g. A3GDN1). La fuente de verdad es el array
  `CODIGOS` en data.js, generado a partir de `AREAS × NIVELES_POR_AREA`.
- **MAX_TRIENIOS = 9** — tope fijo derivado de la escala del convenio (5+3+1).
  `trieniosCompletados` nunca devuelve más de 9 independientemente de la antigüedad.
- **`complementoPersonal` nunca incluye trienios**, ni al inicio ni al recalcular tras
  una modificación salarial. Se usa siempre `getTablaSalarial` (sin trienios), no
  `salarioTeoricoConvenio` (que sí los incluye).
- **`perdidaAbsorcion` solo cuenta trienios ganados durante el período**, no los previos.
  Los trienios anteriores a `yearInicio` ya estaban absorbidos antes del período analizado
  y distorsionan el mensaje — un trabajador con 7 trienios previos mostraría cifras un 50%
  superiores a uno sin antigüedad con el mismo salario, lo cual no es representativo.
  Ver `importeAntigPeriodo` en `generarSerie`. El campo `desglose.antig` sigue siendo el
  total (para la columna de trienios); `desglose.antigPeriodo` es el usado en el cálculo
  de absorción.
- **Validación: `fechaAlta` no puede ser posterior a `yearInicio`.** Si el usuario entra
  una fecha de alta dentro del período o posterior al año de inicio, se bloquea el cálculo
  y se muestra un error bajo los selectores de fecha de alta (`#error-alta`). La validación
  se ejecuta en `validarFechaAlta()` y se llama desde `actualizar()`, el handler de
  `onAltaChange` y el handler de `sel-year`.
- **Validación: `salarioInicio` no puede ser inferior al mínimo de convenio.** `validarSalario()`
  compara contra `getTablaSalarial(nivelInicio, yearInicio, area).total` y bloquea el cálculo
  con mensaje explicativo si el salario está por debajo. Se llama desde `actualizar()`, el
  handler de `inp-salario` y el handler del combobox de grupo.
- **Auto-promoción E-2 → E-1** — implementada en `generarSerie` (data.js). Si `nivelActual === 'E-2'`
  y `year >= 2023` y el trabajador tiene ≥ 1 trienio (3+ años), el nivel sube automáticamente
  a E-1 ese año y se mantiene. El campo `e2Promovido: true` en el punto de serie marca el año
  de la promoción. En la tabla se muestra un badge `↑E-1` en ámbar; el tooltip del código
  explica la causa. El complemento personal no se recalcula (mismo comportamiento que una
  modificación de nivel manual).
- **Compartir por URL** — botón "Copiar enlace" al final del panel lateral. Construye la URL
  con params (`yi`, `yf`, `g`, `s`, `a`) en memoria y la copia al portapapeles sin modificar
  la barra del navegador. No incluye modificaciones. Al recibir un enlace, `leerDesdeURL()`
  lee los params, parchea el estado y limpia la URL inmediatamente con `history.replaceState`.
  La URL del navegador nunca expone datos del usuario salvo acción explícita.
- **Tooltips: `position: fixed`** — los `.th-help-popup` usan `position: fixed` + JS para
  posicionarse, en lugar de `position: absolute`. Esto evita el recorte por `overflow-x: auto`
  del `.tabla-wrapper`. El posicionamiento se calcula en `bindEventos` con `getBoundingClientRect`
  en cada `mouseenter`, respetando las clases `--left` y `--right`.
- **`scrollbar-gutter: stable`** en `html` — evita el desplazamiento de layout al aparecer
  la barra de scroll cuando un tooltip alarga la página.

---

## Modelo de cálculo (decisiones clave)

### `salarioInicio` como salario de 2021

El usuario introduce su salario "previo al período". Se trata como el salario que
cobraba en 2021, antes de que entrara en vigor el XVIII Convenio.

### `complementoPersonal` — sin trienios

```js
complementoPersonal = salarioInicio - tablaInicio.total   // tablaInicio.total = salarioBase + plusConvenio, SIN trienios
```

Los trienios **no forman parte del complemento personal**. Solo los trienios
ganados **durante el período** (`yearInicio`–`yearFin`) contribuyen a `perdidaAbsorcion`.
Los trienios previos al período se excluyen del cálculo de absorción porque ya estaban
absorbidos antes y distorsionan la comparación entre trabajadores con distinta antigüedad.

Cuando hay una **modificación salarial**, el complemento se recalcula como:
```js
complementoPersonal = getTablaSalarial(nivel, year, area).total  // SIN trienios
  ? nuevoSalario - tablasMod.total
  : 0;
```

### IPC aplicado — modelo retardado (decisión de negocio)

```js
const poder = aplicarIPC(salarioInicio, yearInicio - 1, year);
// Para year=2022: aplica IPC[2021] = 3,1%
// Para year=2023: aplica IPC[2021] × IPC[2022]
// Para year=2024: aplica IPC[2021] × IPC[2022] × IPC[2023]
// ...
ipc: IPC[year - 1]   // columna "IPC año ant."
```

**Razonamiento:** el IPC de un año Y se conoce a principios de Y+1. Por tanto, para
mantener el poder adquisitivo durante el año Y, la empresa debería haber aplicado
el IPC de Y-1 (el último dato conocido) al inicio de Y. Si no lo hace, la pérdida
se acumula a lo largo de todo el año Y. Por eso cada fila muestra `IPC[year-1]`:
es el porcentaje que debería haberse subido el sueldo ese año para no perder poder.

La columna de tabla se llama **"IPC año ant."** y el tooltip explica esta lógica.

### Detección de trienio nuevo en año 1

```js
const trieniosAnteriores = year > yearInicio
  ? trieniosCompletados(fechaAlta, year - 1)
  : trieniosPrePeriodo;   // trieniosCompletados(fechaAlta, yearInicio - 1)
```

Así un trienio ganado en el propio `yearInicio` se marca como `trienioNuevo = true`.

---

## Datos del convenio

| Fuente | BOE | Cubre |
|--------|-----|-------|
| XVIII Convenio | BOE-A-2023-17238 (26/07/2023) | Tablas 2022 y 2023, y tablas 2024 base |
| Actualización 2024 por SMI | BOE-A-2024-7019 (09/04/2024) | Tablas 2024 definitivas |
| XIX Convenio | BOE-A-2025-7766 (16/04/2025) | Tablas 2025, 2026 y 2027 |
| IPC media anual | INE | 2021–2025 definitivos; 2026 es previsión |

### Nomenclatura de áreas (XVIII → XIX cambio importante)

| ID en código | Label UI | yearMin | Nota |
|---|---|---|---|
| `bpo` | Área 1 — BPO y Administración Interna | 2022 | |
| `cau` | Área 2 — CAU | 2022 | Top level es A-2, no A-1 |
| `programacion` | Área 3 — Programación | 2022 | |
| `consultoria` | Área 4 — Consultoría de Negocio y Tecnológica | 2022 | |
| `ciberseguridad` | Área 5 — Ciberseguridad | 2025 | Nueva en XIX; no existía antes |
| `estudios-mercado` | Área 6 — Estudios de Mercado | 2022 | Idéntica a Área 1 salvo E-2 (difiere en todos los años) |

**Nota Área 2 (CAU):** el nivel superior es A-2 (no A-1). Código BOE: A2GAN2.
**Nota Área 6:** en el XVIII Convenio era Área 5; en el XIX es Área 6. Tablas propias
(no alias de bpo): A-1..E-1 coinciden con Área 1, pero E-2 difiere en todos los años.

### Niveles por área — todos tienen la misma estructura salvo CAU

```
Área 1, 3, 4, 5, 6:  A-1 | B-1 B-2 | C-1 C-2 C-3 | D-1 D-2 D-3 | E-1 E-2
Área 2 (CAU):         A-2 | B-1 B-2 | C-1 C-2 C-3 | D-1 D-2 D-3 | E-1 E-2
```

E-2 es el nivel de entrada. A los 3 años en E-2 el trabajador pasa automáticamente
a E-1 (desde 01/01/2023, artículo del XVIII Convenio).

### Nomenclatura BOE de niveles

Formato: `A{área}G{grupo}N{nivel}` — e.g. A3GDN1 = Área 3, Grupo D, Nivel 1.
El array `CODIGOS` en data.js es la fuente de verdad del buscador (combobox).
Área 2 (CAU): el nivel superior es A2GAN2 (grupo A, nivel 2).

### Trienios
- Primeros 5 trienios: 5% del salario base cada uno
- Siguientes 3 trienios: 10% del salario base cada uno
- Último trienio (9º): 5% del salario base
- Máximo: **9 trienios** (`MAX_TRIENIOS`, exportado de data.js)
- Base de cálculo: **siempre el salario base del convenio**
- Los trienios son absorbibles por el artículo 7

### Incrementos pactados (`INCREMENTOS` en data.js)
- 2022: — (primer año del XVIII Convenio, sin incremento previo dentro del período)
- 2023: +2,5% (XVIII Convenio)
- 2024: +2,0% + ajuste SMI donde aplique (BOE-A-2024-7019)
- 2025: +4,0% (XIX Convenio, reestructura tablas)
- 2026: +3,0% (XIX Convenio)
- 2027: +3,0% (XIX Convenio) — fuera del rango de análisis de la UI

Los porcentajes aplican al **total** del nivel. Se muestran en la columna Convenio de la tabla.

### IPC España — media anual (fuente INE)
| Año | Valor | Estado | Uso en modelo |
|-----|-------|--------|---------------|
| 2021 | 3,1% | Definitivo | Aplicado en fila 2022 |
| 2022 | 8,4% | Definitivo | Aplicado en fila 2023 |
| 2023 | 3,5% | Definitivo | Aplicado en fila 2024 |
| 2024 | 2,8% | Definitivo | Aplicado en fila 2025 |
| 2025 | 2,7% | Definitivo | Aplicado en fila 2026 |
| 2026 | 2,4% | Previsión (Funcas / Oxford Economics, enero 2026) | Aplicado en fila 2027 (fuera de rango actual) |

---

## Estética

Variables de color en `css/styles.css`:
```
--rojo:     #c0392b   línea salario real, pérdidas, KPIs negativos
--amarillo: #9e6c00   sin absorción, antigüedad (ámbar/ocre)
--azul:     #1a7a8a   salario real en tabla/gráfico (teal)
--fondo:    #f5f4f0   fondo general (blanco cálido)
--texto:    #1a1a1a   texto principal (casi negro)
```

Fuentes: `Playfair Display` (titulares/KPIs) · `IBM Plex Mono` (etiquetas/datos) · `IBM Plex Sans` (cuerpo)

---

## Estructura de la UI

### Panel lateral (orden de arriba a abajo)
1. Período de análisis (año inicio / año fin) — tooltip en h2
2. Tu situación — tooltip individual en cada campo (salario, grupo profesional, fecha de alta)
3. Añadir modificación — tooltip individual en tipo y nuevo salario; sin tooltip en h2
4. Modificaciones activas — tooltip en h2
5. Compartir — botón "Copiar enlace" + nota explicativa (sin tooltip)

Los h2 de "Tu situación" y "Añadir modificación" no tienen `?` propio; el contexto
se da campo a campo. Los tooltips del panel usan `th-help-popup--right`.

**"Nivel de convenio" renombrado a "Grupo profesional"** en todos los labels de UI
y en la cabecera de la tabla (columna "Grupo").

### Cabecera
- `h1` a la izquierda, subtítulo a la derecha (flex, align flex-end).
- Subtítulo: "Calculadora de pérdida salarial en el sector TIC · Período 2022–2026"

### Meta tags (SEO y redes sociales)
- `<title>` y `<meta name="description">` para SEO
- Open Graph (`og:title`, `og:description`, `og:url`, `og:type`) para WhatsApp/Telegram/LinkedIn
- Twitter Card (`twitter:card`, `twitter:title`, `twitter:description`) para X

### Footer
- Fuentes del convenio como enlaces al BOE e INE
- Nota: "Los cálculos son orientativos y pueden contener errores."
- Nota de privacidad: "Esta herramienta no recoge ningún dato personal. Todo el cálculo ocurre en tu navegador."
- Gap entre bloques del footer: 16px

### Gráfico (canvas 2D nativo)
Cuatro líneas en orden de leyenda: Convenio · Salario real · Sin absorción * · Equiv. IPC.
El resize reutiliza `_serie` cacheada, sin recalcular la serie.
**Área sombreada** entre la línea azul (salario real) y la roja (equiv. IPC) con
`rgba(192, 57, 43, 0.10)` — se dibuja antes de las líneas para que queden encima.
El `*` en "Sin absorción *" remite a la nota `<p class="grafico-nota">` bajo el canvas:
"Solo incluye trienios generados en el período analizado".

---

## Estado de la aplicación (app.js)

```js
const state = {
  yearInicio:     2022,
  yearFin:        2026,
  area:           'programacion',
  nivelInicio:    'C-2',
  salarioInicio:  32_000,
  fechaAlta:      '2019-01',   // formato YYYY-MM, selectores año/mes independientes
  modificaciones: [],
  _nextId:        1,
}
```

Caso por defecto elegido como perfil representativo del sector: programador C-2 (mid-senior),
32.000€, alta enero 2019 → 1 trienio en 2022, 2 trienios en 2025.

---

## KPIs (orden en pantalla)

1. **Tu salario actual** (azul) — último salario real registrado
2. **Dinero perdido por absorción** (ámbar) — `calcularAcumulados(serie).perdidaAbsorcion`
3. **Tu salario sin absorción** (ámbar) — complemento + tablas convenio + trienios acumulados
4. **Dinero perdido frente al IPC** (rojo) — `calcularAcumulados(serie).perdidaPoder` (suma anual en €)
5. **Tu salario equivalente al IPC** (rojo) — `aplicarIPC(salarioInicio, yearInicio-1, yearFin+1)`

## Tabla detalle (columnas)

| # | Columna | Clase CSS | Notas |
|---|---------|-----------|-------|
| 0 | Año | — | |
| 1 | Grupo | `nivel` | Código BOE (e.g. A3GCN2); badge `↑E-1` si hubo auto-promoción; tooltip: área + nivel + nota promoción si aplica |
| 2 | Convenio | `teo` | Tablas BOE + % incremento pactado en negrita |
| 3 | Salario real | `val-real` | Si hay modificación salarial ese año, muestra `(+X.X%)` sobre el salario anterior |
| 4 | Sin absorción | `sinabs` | |
| 5 | Trienios | `trienio` | N · importe €; negrita si trienio nuevo ese año |
| 6 | Pérd. absorción | `sinabs` | Tooltip desglosa: por trienios + por subida de tablas |
| 7 | Salario IPC | `val-ipc` | |
| 8 | Pérd. poder adq. | `neg` | Tooltip incluye frase contextual: "Para mantener el poder adquisitivo de tu salario de {yearInicio-1}, necesitarías cobrar X € en {year}" |
| 9 | IPC año ant. | `ipc` | IPC[year-1]; tooltip explica el modelo retardado |
---

## Tests

```
npm test          # vitest run (21 tests, todos en data.js)
npm run test:watch
```

Cubren: `getTablaSalarial`, `MAX_TRIENIOS`, serie completa (IPC, trienios, complemento,
pérdidas, modificaciones salariales) y `calcularAcumulados`.

---

## Pendiente / roadmap

- [x] Tooltips por columna en tabla detalle
- [x] Multi-área implementado (6 áreas, combobox único con código BOE)
- [x] Modelo desde 2021: IPC y trienios reflejan pérdida desde el año 1
- [x] Tests unitarios de data.js (Vitest, 21 tests)
- [x] Variables CSS semánticamente correctas (--fondo, --texto)
- [x] KPI de pérdida IPC en euros (acumulado) en lugar de % — equipara visualmente las dos pérdidas
- [x] Fila de totales en tfoot con pérd. absorción + pérd. poder + IPC acumulado %
- [x] Área sombreada en gráfico entre salario real y equiv. IPC
- [x] Caso por defecto representativo: C-2 · 32.000€ · alta 2019-01
- [x] Meta tags OG y Twitter Card para previsualizaciones en redes sociales (WhatsApp, Telegram, X)
- [x] Nota de privacidad en footer: cálculo local, sin datos personales, sin envío a servidor
- [x] "Nivel de convenio" → "Grupo profesional" en toda la UI; "Nivel" → "Grupo" en cabecera tabla
- [x] Flechas de input numérico siempre visibles (`opacity: 1` en webkit spin button)
- [x] Combobox select-like: abre lista completa en focus, flecha SVG como native select
- [x] Búsqueda en combobox por código BOE Y por descripción, con normalización de acentos (`_norm`)
- [x] Sin forzar mayúsculas en el input del combobox (`text-transform` eliminado; `_norm` normaliza internamente)
- [x] Botón × circular para limpiar combobox; oculto cuando vacío (`.combobox-clear[hidden] { display: none }`)
- [x] Descripción del grupo bajo el input del combobox (`#inp-codigo-desc`, clase `.codigo-desc`)
- [x] Tooltips individuales por campo en "Tu situación" y "Añadir modificación" (sin tooltip en h2)
- [x] % de cambio salarial en modificaciones activas y en celda salario real del año de la modificación
- [x] Año por defecto en "Añadir modificación": 2024
- [x] Tablas salariales XVIII Convenio completas y verificadas BOE (todas las áreas, 2022–2024)
- [x] Tablas salariales XIX Convenio completas y verificadas BOE (todas las áreas, 2025–2027)
- [x] Actualización SMI 2024 (BOE-A-2024-7019) aplicada a todas las áreas
- [x] Área 6 (estudios-mercado) con tabla propia — ya no alias de bpo; E-2 difiere en todos los años
- [x] Área 5 (ciberseguridad) corregida: A-1 es el nivel top (no B-1 como estaba estimado)
- [x] Tablas 2027 en data.js (XIX Convenio, fuera del rango de UI pero disponibles)
- [x] `perdidaAbsorcion` limitada a trienios del período — los previos no computan
- [x] Validación: `fechaAlta` no puede ser posterior a `yearInicio` (`#error-alta`)
- [x] Refactorizar `buildTablaTooltip` de switch/case a array de funciones `TOOLTIP_COLS` por columna
- [x] Auto-promoción E-2 → E-1 (art. XVIII Convenio, desde 2023, ≥3 años en empresa)
- [x] Compartir por URL — botón en panel, copia al portapapeles, URL nunca expuesta, limpia al recibir
- [x] Validación salario por debajo del mínimo de convenio — bloquea cálculo con mensaje
- [x] Tooltips: `position: fixed` + JS para escapar del `overflow-x: auto` de `.tabla-wrapper`
- [x] Nota "Sin absorción *" en gráfico — aclara que solo incluye trienios del período
- [x] Textos justificados en tooltips, labels del panel y nota de compartir
- [ ] Actualizar IPC 2026 cuando el INE publique el dato definitivo
- [ ] Versión imprimible / exportar a imagen o PDF
- [ ] Accesibilidad: roles ARIA en combobox, navegación por teclado en tooltips
- [ ] Categorías ad personam (TGS AP, TGM AP, DEL AP) — deferred
