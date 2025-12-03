export interface ClienteReporte {
  id_cliente: number;
  rut: string;
  tipo_cliente: 'persona_natural' | 'empresa';
  nombre?: string;
  apellido?: string;
  razon_social?: string;
  nombre_fantasia?: string;
  giro?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  comuna?: string;
  id_bsale?: number;
  fecha_sincronizacion?: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_modificacion: string;
}

// Estadísticas de clientes
export interface EstadisticasClientes {
  total: number;
  activos: number;
  inactivos: number;
  porcentajeActivos: string; // "100.00"
}

// Estadísticas de herramientas
export interface EstadisticasHerramientas {
  total: number;
  activas: number;
  inactivas: number;
  conStock: number;
  sinStock: number;
  valorInventario: number;
}

export interface ContratoPorMes {
  mes: string;        // Ej: "2025-12"
  cantidad: string;   // Ej: "14"
}

export interface PorEstado {
  activos: number;
  finalizados: number;
  vencidos: number;
  cancelados: number;
}

export interface EstadisticasContratos {
  totalContratos: number;
  porEstado: PorEstado;
  montoTotalEnArriendo: number;
  contratosPorMes: ContratoPorMes[];
}