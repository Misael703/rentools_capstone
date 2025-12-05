export interface Cliente {
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

export interface CreateClienteForm {
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
}

export interface ClienteAutocomplete {
  id_cliente: number;
  tipo_cliente: 'persona_natural' | 'empresa';
  label: string;
  rut: string;

  // opcionales
  nombre?: string | null;
  apellido?: string | null;
  razon_social?: string | null;
}