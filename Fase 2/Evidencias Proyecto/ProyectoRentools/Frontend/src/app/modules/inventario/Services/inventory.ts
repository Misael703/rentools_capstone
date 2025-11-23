import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';

import { Herramienta, CreateHerramientaForm, UpdateHerramientaForm } from '../Interfaces/inventario.interface';

@Injectable({
  providedIn: 'root'
})
export class Inventory {
  private apiUrl = 'http://localhost:3000/api/herramientas';

  constructor(private http: HttpClient) { }

  // ============================================================
  // 1. Verificar SKU
  // GET /herramientas/verificar-sku/:sku
  // ============================================================
  verificarSku(sku: string): Observable<{ existe: boolean }> {
    return this.http.get<{ existe: boolean }>(`${this.apiUrl}/verificar-sku/${sku}`);
  }

  // ============================================================
  // 2. Verificar Barcode
  // GET /herramientas/verificar-barcode/:barcode
  // ============================================================
  verificarBarcode(barcode: string): Observable<{ existe: boolean; sku?: string }> {
    return this.http.get<{ existe: boolean; sku?: string }>(
      `${this.apiUrl}/verificar-barcode/${barcode}`
    );
  }

  // ============================================================
  // 3. Importar desde Bsale
  // POST /herramientas/importar-desde-bsale
  // ============================================================
  importarDesdeBsale(data: { sku_bsale: string }): Observable<Herramienta> {
    return this.http.post<Herramienta>(`${this.apiUrl}/importar-desde-bsale`, data);
  }

  // ============================================================
  // 4. Crear manualmente
  // POST /herramientas
  // ============================================================
  create(data: CreateHerramientaForm): Observable<Herramienta> {
    return this.http.post<Herramienta>(`${this.apiUrl}`, data);
  }

  // ============================================================
  // 5. Lista completa con filtros y paginación
  // GET /herramientas
  // Query: search, activo, page, limit
  // ============================================================
  findAll(params: {
    search?: string;
    activo?: boolean;
    page?: number;
    limit?: number;
  }): Observable<{ data: Herramienta[]; total: number; page: number; limit: number }> {

    let queryParams = new HttpParams();
    if (params.search) queryParams = queryParams.set('search', params.search);
    if (params.activo !== undefined) queryParams = queryParams.set('activo', params.activo);
    if (params.page) queryParams = queryParams.set('page', params.page);
    if (params.limit) queryParams = queryParams.set('limit', params.limit);

    return this.http.get<{ data: Herramienta[]; total: number; page: number; limit: number }>(
      this.apiUrl,
      { params: queryParams }
    );
  }

  // ============================================================
  // 6. Herramientas disponibles
  // GET /herramientas/disponibles
  // ============================================================
  findDisponibles(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<{ data: Herramienta[]; total: number; page: number; limit: number }> {

    let queryParams = new HttpParams();
    if (params?.search) queryParams = queryParams.set('search', params.search);
    if (params?.page) queryParams = queryParams.set('page', params.page);
    if (params?.limit) queryParams = queryParams.set('limit', params.limit);

    return this.http.get<{ data: Herramienta[]; total: number; page: number; limit: number }>(
      `${this.apiUrl}/disponibles`,
      { params: queryParams }
    );
  }

  // ============================================================
  // 7. Stats generales
  // GET /herramientas/stats
  // ============================================================
  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }

  // ============================================================
  // 8. Sincronizar TODO desde Bsale
  // POST /herramientas/sync-from-bsale
  // ============================================================
  syncFromBsale(): Observable<any> {
    return this.http.post(`${this.apiUrl}/sync-from-bsale`, {});
  }

  // ============================================================
  // 9. Buscar por SKU
  // GET /herramientas/sku/:sku
  // ============================================================
  findBySku(sku: string): Observable<Herramienta> {
    return this.http.get<Herramienta>(`${this.apiUrl}/sku/${sku}`);
  }

  // ============================================================
  // 10. Sincronizar una herramienta específica por SKU
  // POST /herramientas/sync-sku/:sku
  // ============================================================
  syncOneBySku(sku: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/sync-sku/${sku}`, {});
  }

  // ============================================================
  // 11. Obtener una herramienta por ID
  // GET /herramientas/:id
  // ============================================================
  getById(id: number): Observable<Herramienta> {
    return this.http.get<Herramienta>(`${this.apiUrl}/${id}`);
  }

  // ============================================================
  // 12. Disponibilidad por ID
  // GET /herramientas/:id/disponibilidad?cantidad=
  // ============================================================
  checkDisponibilidad(id: number, cantidad: number = 1): Observable<any> {
    const params = new HttpParams().set('cantidad', cantidad);
    return this.http.get<any>(`${this.apiUrl}/${id}/disponibilidad`, { params });
  }

  // ============================================================
  // 13. Editar herramienta
  // PATCH /herramientas/:id
  // ============================================================
  update(id: number, data: UpdateHerramientaForm): Observable<Herramienta> {
    return this.http.patch<Herramienta>(`${this.apiUrl}/${id}`, data);
  }

  // ============================================================
  // 14. Activar herramienta
  // PATCH /herramientas/:id/activate
  // ============================================================
  activar(id: number): Observable<Herramienta> {
    return this.http.patch<Herramienta>(`${this.apiUrl}/${id}/activate`, {});
  }

  // ============================================================
  // 15. Eliminar (soft delete)
  // DELETE /herramientas/:id
  // ============================================================
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ============================================================
  // 16. Obtener configuraciones de productos Bsale (para combo box)
  // GET /bsale/products-config
  // ============================================================
  getBsaleProductConfigs(): Observable<Array<{
    id: number;
    product_id_bsale: number;
    product_name: string;
    created_at: string;
    updated_at: string;
  }>> {
    return this.http.get<Array<{
      id: number;
      product_id_bsale: number;
      product_name: string;
      created_at: string;
      updated_at: string;
    }>>('http://localhost:3000/api/bsale/products-config');
  }

}
