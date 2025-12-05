// ======================================================
// ENUMS
// ======================================================

export enum EstadoDevolucion {
    BUEN_ESTADO = 'buen_estado',
    DANADA = 'danada',
    REPARACION_MENOR = 'reparacion_menor',
}

// ======================================================
// Interfaces PRINCIPALES
// ======================================================

export interface Devolucion {
    id_devolucion: number;
    id_detalle: number;
    cantidad_devuelta: number;
    fecha_devolucion: string; // ISO string
    estado: EstadoDevolucion;
    observaciones?: string;
    monto_cobrado?: number;

    // Relaciones
    detalle?: DetalleContrato;
    contrato?: Contrato;
}

// ======================================================
// DTOs – Crear / Crear Masiva / Actualizar / Buscar
// ======================================================

export interface CreateDevolucionDto {
    id_detalle: number;
    cantidad_devuelta: number;
    fecha_devolucion: string;
    estado: EstadoDevolucion;
    observaciones?: string;
}

export interface CreateDevolucionMasivaDto {
    devoluciones: CreateDevolucionDto[];
}

export interface UpdateDevolucionDto {
    estado?: EstadoDevolucion;
    observaciones?: string;
}

export interface SearchDevolucionDto {
    page?: number;
    limit?: number;

    id_contrato?: number;
    estado?: EstadoDevolucion;
    fecha_devolucion?: string;
}

// ======================================================
// Relaciones con contratos
// ======================================================

export interface Contrato {
    id_contrato: number;
    id_cliente: number;
    id_usuario: number;
    fecha_inicio: string;
    fecha_termino_estimada: string;
    fecha_termino_real?: string;
    total: number;
    estado_contrato: string;

    monto_estimado: number;
    monto_garantia: number;

    cliente?: Cliente;
    usuario?: Usuario;
    detalles?: DetalleContrato[];
}

export interface DetalleContrato {
    id_detalle_contrato: number;
    id_contrato: number;
    id_herramienta: number;
    cantidad: number;
    precio_unitario: number;

    herramienta?: Herramienta;
}

// ======================================================
// Relaciones con cliente, herramienta, usuario
// ======================================================

export interface Herramienta {
    id_herramienta: number;
    nombre: string;
    codigo: string;
    descripcion?: string;
    stock: number;
    estado: string;
}

export interface HerramientaForm {
    id_detalle: number;
    seleccionada: boolean;
    cantidad_devuelta: number;
    estado: EstadoDevolucion;
    observaciones?: string;
}

export interface Cliente {
    id_cliente: number;
    nombre: string;
    razon_social?: string;
    rut?: string;
    telefono?: string;
    direccion?: string;
}

export interface Usuario {
    id_usuario: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
}

// ======================================================
// API GENERICOM
// ======================================================

export interface ApiResponse<T> {
    message: string;
    data: T;
}

export interface PaginationResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}