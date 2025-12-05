export enum MetodoPago {
    EFECTIVO = 'efectivo',
    TARJETA_DEBITO = 'tarjeta_debito',
    TARJETA_CREDITO = 'tarjeta_credito',
    TRANSFERENCIA = 'transferencia'
}

export interface CreatePago {
    id_contrato: number;
    fecha_pago: string;       // YYYY-MM-DD
    monto: number;
    metodo_pago: MetodoPago;
    referencia?: string;
}

export interface UpdatePago {
    referencia?: string;
}

export interface SearchPago {
    page?: number;
    limit?: number;

    id_contrato?: number;
    metodo_pago?: MetodoPago;
    fecha_pago?: string;

    fecha_desde?: string;
    fecha_hasta?: string;
}

export interface Pago {
    id_pago: number;
    id_contrato: number;
    fecha_pago: string;
    monto: number;
    metodo_pago: MetodoPago;
    referencia: string | null;
    id_dte: number | null;
    created_at: string;
    updated_at: string;

    contrato?: {
        id_contrato?: number;
        fecha_inicio?: string;
        fecha_termino_estimada?: string;
        fecha_termino_real?: string;
        monto_final?: number;
        monto_estimado?: number;
        estado?: string;
    };
}

export interface ResumenPagosContrato {
    id_contrato: number;

    monto_total_a_pagar: number;
    monto_total_pagado: number;
    saldo_pendiente: number;

    estado_pago: 'pendiente' | 'pagado_completo' | 'sobrepagado';

    pagos: Pago[];

    contrato?: {
        fecha_termino_real?: string;
        monto_final?: number;
        monto_estimado?: number;
    };
}

export interface PaginatedPagos {
    data: Pago[];
    total: number;
    page: number;
    limit: number;
}

export interface PagosStats {
    total_recaudado: number;
    total_por_metodo: {
        efectivo: number;
        tarjeta_debito: number;
        tarjeta_credito: number;
        transferencia: number;
    };
    total_por_mes: {
        [mes: string]: number; // ejemplo: "2025-01": 540000
    };
}