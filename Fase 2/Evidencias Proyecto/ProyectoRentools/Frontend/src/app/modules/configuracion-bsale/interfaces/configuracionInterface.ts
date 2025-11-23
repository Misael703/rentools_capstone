export interface BsaleProductCached {
  id: number;
  product_id_bsale: number;
  name: string;
  state: number;
  en_configuracion: boolean;
  fecha_sincronizacion: string;
  created_at: string;
  updated_at: string;
}

export interface BsaleProductConfig {
  id: number;
  product_id_bsale: number;
  product_name: string;
  created_at: string;
  updated_at: string;
}

export interface BsaleProductCachedResponse {
  items: BsaleProductCached[];
  total: number;
}