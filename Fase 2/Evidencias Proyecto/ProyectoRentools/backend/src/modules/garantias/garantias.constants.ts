/**
 * Porcentajes configurables para la devolución de garantía
 * Basados en el estado de las herramientas devueltas
 */
export const PORCENTAJE_DEVOLUCION = {
  /**
   * 100% - Todas las herramientas en buen estado
   */
  BUEN_ESTADO: 1.0,

  /**
   * 75% - Herramientas con daños menores que requieren reparación
   */
  REPARACION_MENOR: 0.75,

  /**
   * 50% - Herramientas dañadas significativamente
   */
  DANADA: 0.5,

  /**
   * 0% - Herramientas no devueltas
   */
  NO_DEVUELTA: 0.0,
};

/**
 * Razones predefinidas para la devolución de garantía
 */
export const RAZONES_DEVOLUCION = {
  TODAS_BUEN_ESTADO: 'Todas las herramientas devueltas en buen estado',
  REPARACION_MENOR: 'Se encontraron herramientas con daños menores',
  DANADAS: 'Se encontraron herramientas dañadas',
  NO_DEVUELTAS: 'No se devolvieron todas las herramientas',
  PARCIALMENTE_DEVUELTAS: 'Solo se devolvió parte de las herramientas',
};
