// =========================
// ENUMS
// =========================

export enum EstadoContrato {
  ACTIVO = 'activo',
  FINALIZADO = 'finalizado',
  VENCIDO = 'vencido',
  CANCELADO = 'cancelado',
}

export enum TipoEntrega {
  RETIRO = 'retiro',
  DESPACHO = 'despacho',
}

// =========================
// DETALLE CONTRATO
// =========================

export interface DetalleContrato {
  id_detalle: number;
  id_contrato: number;
  id_herramienta: number;
  cantidad: number;
  dias_arriendo: number;
  precio_unitario: number;
  subtotal: number;

  nombre_herramienta?: string;
  sku_herramienta?: string;

  // Datos adicionales enviados por el backend (opcional)
  herramienta?: {
    id_herramienta: number;
    nombre: string;
    precio_arriendo: number;
    stock: number;
    descripcion?: string;
  };

  created_at?: string;
  updated_at?: string;
}

// DTO para crear detalle
export interface CreateDetalleContratoDto {
  id_herramienta: number;
  cantidad: number;
  dias_arriendo: number;
}

// =========================
// CONTRATO
// =========================

export interface Contrato {
  id_contrato: number;

  id_cliente: number;
  id_usuario: number;

  tipo_entrega: TipoEntrega;
  estado: EstadoContrato;

  fecha_inicio: string;
  fecha_termino_estimada: string;
  fecha_termino_real?: string | null;

  observaciones?: string | null;

  monto_estimado: number;  // backend
  monto_final?: number | null; // backend
  monto_garantia?: number | null;

  detalles: DetalleContrato[];

  // Relaciones opcionales
  cliente?: {
    id_cliente: number;
    tipo_cliente: 'empresa' | 'persona_natural';
    nombre?: string;
    apellido?: string;
    razon_social?: string;
    giro?: string;
    rut?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    comuna?: string;
    activo?: boolean;
    id_bsale?: number;
    created_at?: string;
    updated_at?: string;
  };

  usuario?: {
    id_usuario: number;
    nombre: string;
    email: string;
    id_rol?: number;
    activo?: boolean;
    created_at?: string;
    updated_at?: string;
  };

  created_at?: string;
  updated_at?: string;
}

// =========================
// CREATE CONTRATO DTO
// =========================

export interface CreateContratoDto {
  id_cliente: number;
  tipo_entrega: TipoEntrega;
  fecha_inicio: string;
  fecha_termino_estimada: string;
  observaciones?: string;
  detalles: CreateDetalleContratoDto[];
}

// =========================
// UPDATE CONTRATO DTO
// =========================

export interface UpdateContratoDto {
  tipo_entrega?: TipoEntrega;
  observaciones?: string;
  monto_garantia?: number;
}

// =========================
// SEARCH CONTRATO DTO
// =========================

export interface SearchContratoDto {
  page?: number;
  limit?: number;

  id_cliente?: number;
  id_usuario?: number;

  estado?: EstadoContrato;
  tipo_entrega?: TipoEntrega;

  fecha_inicio?: string;
  fecha_termino_estimada?: string;

  fecha_inicio_desde?: string;
  fecha_inicio_hasta?: string;
}

// =========================
// RESPUESTAS DEL BACKEND
// =========================

export interface PaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface FinalizarContratoResponse {
  message: string;
  monto_final: number;
  contrato: Contrato;
}