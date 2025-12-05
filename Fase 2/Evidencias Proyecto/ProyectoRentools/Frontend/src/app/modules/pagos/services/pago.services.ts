import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  Pago,
  CreatePago,
  UpdatePago,
  SearchPago,
  PaginatedPagos,
  ResumenPagosContrato,
  PagosStats,
} from '../interfaces/pago.interfaces';

@Injectable({
  providedIn: 'root',
})
export class PagosService {
  private readonly apiUrl = 'http://localhost:3000/api/pagos';

  constructor(private http: HttpClient) { }

  // --------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------
  private getToken(): string {
    return localStorage.getItem('token') || '';
  }

  private getHeaders(): { headers: HttpHeaders } {
    const token = this.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  private buildParams(filters?: { [key: string]: any }): HttpParams {
    let params = new HttpParams();
    if (!filters) return params;

    Object.keys(filters).forEach(key => {
      const val = (filters as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return params;
  }

  // --------------------------------------------------------------
  // 1) POST /pagos
  // Crear un pago nuevo
  // --------------------------------------------------------------
  create(dto: CreatePago): Observable<Pago> {
    return this.http.post<Pago>(this.apiUrl, dto, this.getHeaders());
  }

  // --------------------------------------------------------------
  // 2) GET /pagos/stats
  // Obtener estadísticas globales de los pagos
  // --------------------------------------------------------------
  getStats(): Observable<PagosStats> {
    return this.http.get<PagosStats>(`${this.apiUrl}/stats`, this.getHeaders());
  }

  // --------------------------------------------------------------
  // 3) GET /pagos/contrato/:id_contrato/resumen
  // Resumen completo de pagos para un contrato
  // --------------------------------------------------------------
  getResumenContrato(id_contrato: number): Observable<ResumenPagosContrato> {
    return this.http.get<any>(`${this.apiUrl}/contrato/${id_contrato}/resumen`, this.getHeaders())
      .pipe(
        map(res => {
          if (res && res.resumen) return res.resumen;
          if (res && res.data && res.data.resumen) return res.data.resumen;
          return res; // fallback
        })
      );
  }

  // --------------------------------------------------------------
  // 4) GET /pagos/contrato/:id_contrato
  // Lista de pagos de un contrato
  // --------------------------------------------------------------
  findByContrato(id_contrato: number): Observable<Pago[]> {
    return this.http.get<Pago[]>(
      `${this.apiUrl}/contrato/${id_contrato}`,
      this.getHeaders()
    );
  }

  // --------------------------------------------------------------
  // 5) GET /pagos
  // Filtros + paginación
  // --------------------------------------------------------------
  findAll(filters?: SearchPago): Observable<PaginatedPagos> {
    const params = this.buildParams(filters as any);

    return this.http.get<PaginatedPagos>(this.apiUrl, {
      headers: this.getHeaders().headers,
      params,
    });
  }

  // --------------------------------------------------------------
  // 6) GET /pagos/:id
  // Obtener un pago por ID
  // --------------------------------------------------------------
  findOne(id: number): Observable<Pago> {
    return this.http.get<Pago>(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  // --------------------------------------------------------------
  // 7) PATCH /pagos/:id
  // Solo actualiza la referencia
  // --------------------------------------------------------------
  update(id: number, dto: UpdatePago): Observable<Pago> {
    return this.http.patch<Pago>(
      `${this.apiUrl}/${id}`,
      dto,
      this.getHeaders()
    );
  }

  // --------------------------------------------------------------
  // 8) DELETE /pagos/:id
  // Eliminar un pago (solo si no tiene DTE)
  // --------------------------------------------------------------
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getHeaders());
  }
}