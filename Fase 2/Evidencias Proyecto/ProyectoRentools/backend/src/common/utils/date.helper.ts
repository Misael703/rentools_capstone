/**
 * Utilidades para manejo de fechas
 * Resuelve problemas de zona horaria al parsear fechas desde strings
 */

/**
 * Parsea un string de fecha como fecha local (sin conversión UTC)
 *
 * Ejemplo:
 * - Input: "2025-11-25"
 * - Output: Date con 2025-11-25 00:00:00 en zona horaria local
 *
 * PROBLEMA RESUELTO:
 * new Date("2025-11-25") → Interpreta como UTC, puede cambiar de día
 * parseLocalDate("2025-11-25") → Interpreta como local, mantiene el día
 *
 * @param dateString - Fecha en formato "YYYY-MM-DD"
 * @returns Date object con la fecha en zona horaria local
 */
export function parseLocalDate(dateString: string): Date {
  // Separar año, mes, día
  const [year, month, day] = dateString.split('-').map(Number);

  // Crear Date con parámetros (mes es 0-indexed)
  // Esto crea la fecha en zona horaria local, no UTC
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Parsea un string de fecha-hora como fecha local
 *
 * @param dateTimeString - Fecha en formato "YYYY-MM-DD HH:mm:ss"
 * @returns Date object con la fecha-hora en zona horaria local
 */
export function parseLocalDateTime(dateTimeString: string): Date {
  const [datePart, timePart] = dateTimeString.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);

  if (timePart) {
    const [hour, minute, second] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute, second, 0);
  }

  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Formatea una fecha a string YYYY-MM-DD
 *
 * @param date - Date object
 * @returns String en formato "YYYY-MM-DD"
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Formatea una fecha a string legible en español
 *
 * @param date - Date object
 * @returns String formateado (ej: "25 de noviembre de 2025")
 */
export function formatDateES(date: Date): string {
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const day = date.getDate();
  const month = meses[date.getMonth()];
  const year = date.getFullYear();

  return `${day} de ${month} de ${year}`;
}
