import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Contrato,
  CreateContratoDto,
  UpdateContratoDto,
  SearchContratoDto,
  ApiResponse,
  PaginationResponse,
  FinalizarContratoResponse
} from '../Interfaces/contrato.interfaces';

@Injectable({
  providedIn: 'root'
})
export class ContratosService {

  private apiUrl = 'http://localhost:3000/api/contratos';

  constructor(private http: HttpClient) { }

  /** Obtener headers con JWT */
  private getHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  // ============================================================
  // 1. Crear contrato
  // POST /contratos
  // ============================================================
  create(data: CreateContratoDto): Observable<ApiResponse<Contrato>> {
    return this.http.post<ApiResponse<Contrato>>(this.apiUrl, data, this.getHeaders());
  }

  // ============================================================
  // 2. Obtener todos (listado con filtros y paginación)
  // GET /contratos
  // ============================================================
  findAll(filters?: SearchContratoDto): Observable<PaginationResponse<Contrato>> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    // headers + params en un solo objeto
    return this.http.get<PaginationResponse<Contrato>>(this.apiUrl, {
      headers: this.getHeaders().headers,
      params
    });
  }

  // ============================================================
  // 3. Obtener contrato por ID
  // GET /contratos/:id
  // ============================================================
  findById(id: number): Observable<ApiResponse<Contrato>> {
    return this.http.get<ApiResponse<Contrato>>(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  // ============================================================
  // 4. Actualizar campos simples del contrato
  // PATCH /contratos/:id
  // ============================================================
  update(id: number, data: UpdateContratoDto): Observable<ApiResponse<Contrato>> {
    return this.http.patch<ApiResponse<Contrato>>(
      `${this.apiUrl}/${id}`,
      data,
      this.getHeaders()
    );
  }

  // ============================================================
  // 5. Finalizar contrato
  // PATCH /contratos/:id/finalizar
  // ============================================================
  finalizar(id: number): Observable<FinalizarContratoResponse> {
    return this.http.patch<FinalizarContratoResponse>(
      `${this.apiUrl}/${id}/finalizar`,
      {},
      this.getHeaders()
    );
  }

  // ============================================================
  // 6. Cancelar contrato
  // DELETE /contratos/:id
  // ============================================================
  remove(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  // ============================================================
  // 7. Obtener contratos por cliente
  // GET /contratos/cliente/:id_cliente
  // ============================================================
  findByCliente(id_cliente: number, filters?: SearchContratoDto): Observable<Contrato[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value);
        }
      });
    }
    return this.http.get<Contrato[]>(`${this.apiUrl}/cliente/${id_cliente}`, {
      ...this.getHeaders(),
      params
    });
  }

  // ============================================================
  // 8. Obtener contratos por usuario
  // GET /contratos/usuario/:id_usuario
  // ============================================================
  findByUsuario(id_usuario: number, filters?: SearchContratoDto): Observable<Contrato[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value);
        }
      });
    }
    return this.http.get<Contrato[]>(`${this.apiUrl}/usuario/${id_usuario}`, {
      ...this.getHeaders(),
      params
    });
  }

  // ============================================================
  // 9. Obtener contratos vencidos
  // GET /contratos/vencidos
  // ============================================================
  getVencidos(): Observable<Contrato[]> {
    return this.http.get<Contrato[]>(`${this.apiUrl}/vencidos`, this.getHeaders());
  }

  // ============================================================
  // 10. Obtener estadísticas
  // GET /contratos/stats
  // ============================================================
  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`, this.getHeaders());
  }
}
