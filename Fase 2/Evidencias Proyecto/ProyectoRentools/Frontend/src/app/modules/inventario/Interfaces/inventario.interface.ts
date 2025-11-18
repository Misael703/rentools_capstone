export interface Herramienta {
  id_herramienta: number;
  sku_bsale: string;               // SKU que viene desde Bsale
  nombre: string;
  descripcion: string;
  precio_diario: number;
  garantia: number;
  dias_minimo: number;
  stock: number;                   // solo lectura (no editable)
  activo: boolean;
  fecha_creacion: string;
  fecha_modificacion: string;
}
export interface CreateHerramientaForm {
  sku_bsale: string;
  id_bsale?: number | null;
  barcode?: string;
  nombre: string;
  descripcion?: string;
  precio_diario?: number | null;
  garantia?: number | null;
  dias_minimo?: number | null;
  stock?: number | null;
}
export interface UpdateHerramientaForm {
  sku_bsale?: string;
  barcode?: string;
  nombre?: string;
  descripcion?: string;
  precio_diario?: number;
  garantia?: number;
  dias_minimo?: number;
  stock?: number;
  activo?: boolean;
}