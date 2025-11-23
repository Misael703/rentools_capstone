export interface Herramienta {
  id_herramienta: number;
  sku_bsale: string;
  id_bsale: number;
  product_id_bsale: number;
  product_name_bsale: string;
  barcode: string | null;
  nombre: string;
  descripcion: string;
  precio_diario: number;
  garantia: number;
  dias_minimo: number;
  stock: number;                   // solo lectura (no editable)
  activo: boolean;
  created_at: string;
  updated_at: string;
  fecha_sincronizacion: string;
}
export interface CreateHerramientaForm {
  sku_bsale: string;
  id_bsale?: number | null;
  product_id_bsale?: number | null;
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