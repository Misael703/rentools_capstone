import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';

import { Herramienta, CreateHerramientaForm, UpdateHerramientaForm } from '../Interfaces/inventario.interface';

@Injectable({
  providedIn: 'root'
})
export class Inventory {
  private apiUrl = 'http://localhost:3000/api/herramientas';

  constructor(private http: HttpClient) { }

  /** ============================================================
   *   HEADERS con JWT para TODAS las peticiones protegidas
   *  ============================================================ */
  private getHeaders() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  // ============================================================
  // 1. Verificar SKU
  // GET /herramientas/verificar-sku/:sku
  // ============================================================
  verificarSku(sku: string): Observable<{ existe: boolean }> {
    return this.http.get<{ existe: boolean }>(
      `${this.apiUrl}/verificar-sku/${sku}`,
      this.getHeaders()
    );
  }

  // ============================================================
  // 2. Verificar Barcode
  // ============================================================
  verificarBarcode(barcode: string): Observable<{ existe: boolean; sku?: string }> {
    return this.http.get<{ existe: boolean; sku?: string }>(
      `${this.apiUrl}/verificar-barcode/${barcode}`,
      this.getHeaders()
    );
  }

  // ============================================================
  // 3. Importar desde Bsale
  // ============================================================
  importarDesdeBsale(data: { sku_bsale: string }): Observable<Herramienta> {
    return this.http.post<Herramienta>(
      `${this.apiUrl}/importar-desde-bsale`,
      data,
      this.getHeaders()
    );
  }

  // ============================================================
  // 4. Crear herramienta
  // ============================================================
  create(data: CreateHerramientaForm): Observable<Herramienta> {
    return this.http.post<Herramienta>(`${this.apiUrl}`, data, this.getHeaders());
  }

  // ============================================================
  // 5. Lista con filtro + paginación
  // ============================================================
  findAll(params: {
    nombre?: string;
    sku_bsale?: string;
    activo?: boolean;
    page?: number;
    limit?: number;
  }): Observable<{ data: Herramienta[]; total: number; page: number; limit: number }> {

    let queryParams = new HttpParams();

    if (params.nombre) {
      queryParams = queryParams.set('nombre', params.nombre);
    }

    if (params.sku_bsale) {
      queryParams = queryParams.set('sku_bsale', params.sku_bsale);
    }

    if (params.activo !== undefined) {
      queryParams = queryParams.set('activo', String(params.activo));
    }

    if (params.page) {
      queryParams = queryParams.set('page', params.page);
    }

    if (params.limit) {
      queryParams = queryParams.set('limit', params.limit);
    }

    return this.http.get<{ data: Herramienta[]; total: number; page: number; limit: number }>(
      this.apiUrl,
      { params: queryParams, ...this.getHeaders() }
    );
  }

  // ============================================================
  // 6. Herramientas disponibles
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
      { params: queryParams, ...this.getHeaders() }
    );
  }

  // ============================================================
  // 7. Stats
  // ============================================================
  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`, this.getHeaders());
  }

  // ============================================================
  // 8. Sincronizar todo
  // ============================================================
  syncFromBsale(): Observable<any> {
    return this.http.post(`${this.apiUrl}/sync-from-bsale`, {}, this.getHeaders());
  }

  // ============================================================
  // 9. Buscar por SKU
  // ============================================================
  findBySku(sku: string): Observable<Herramienta> {
    return this.http.get<Herramienta>(`${this.apiUrl}/sku/${sku}`, this.getHeaders());
  }

  // ============================================================
  // 10. Sync una herramienta por SKU
  // ============================================================
  syncOneBySku(sku: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/sync-sku/${sku}`, {}, this.getHeaders());
  }

  // ============================================================
  // 11. Obtener por ID
  // ============================================================
  getById(id: number): Observable<Herramienta> {
    return this.http.get<Herramienta>(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  // ============================================================
  // 12. Disponibilidad
  // ============================================================
  checkDisponibilidad(id: number, cantidad: number = 1): Observable<any> {
    const params = new HttpParams().set('cantidad', cantidad);

    return this.http.get<any>(
      `${this.apiUrl}/${id}/disponibilidad`,
      { params, ...this.getHeaders() }
    );
  }

  // ============================================================
  // 13. Editar herramienta
  // ============================================================
  update(id: number, data: UpdateHerramientaForm): Observable<Herramienta> {
    return this.http.patch<Herramienta>(`${this.apiUrl}/${id}`, data, this.getHeaders());
  }

  // ============================================================
  // 14. Activar herramienta
  // ============================================================
  activar(id: number): Observable<Herramienta> {
    return this.http.patch<Herramienta>(`${this.apiUrl}/${id}/activate`, {}, this.getHeaders());
  }

  // ============================================================
  // 15. Eliminar
  // ============================================================
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  // ============================================================
  // 16. Productos Bsale (configs)
  // ============================================================
  getBsaleProductConfigs(): Observable<any[]> {
    return this.http.get<any[]>(
      `http://localhost:3000/api/bsale/products-config`,
      this.getHeaders()
    );
  }

}
