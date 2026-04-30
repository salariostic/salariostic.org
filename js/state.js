// Estado compartido de la aplicación.
// Importado por app.js y los módulos de render que necesitan leer el estado.
export const state = {
  yearInicio:     2022,
  yearFin:        2026,
  area:           'programacion',
  nivelInicio:    'C-2',
  salarioInicio:  32_000,
  fechaAlta:      '2019-01',   // formato YYYY-MM
  modificaciones: [],
  _nextId:        1,
};
