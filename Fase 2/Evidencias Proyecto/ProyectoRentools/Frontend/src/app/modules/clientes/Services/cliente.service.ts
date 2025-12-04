// src/app/modules/clientes/clientes.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente, ClienteAutocomplete } from '../Interfaces/cliente.interfaces';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private apiUrl = 'http://localhost:3000/api/clientes';

  constructor(private http: HttpClient) { }

  /** Headers con JWT */
  private getHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token'); // tu JWT
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  /** Obtener todos los clientes con filtros opcionales */
  getAll(filters?: any): Observable<{
    data: Cliente[],
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<{
      data: Cliente[],
      total: number,
      page: number,
      limit: number,
      totalPages: number
    }>(this.apiUrl, { ...this.getHeaders(), params });
  }

  /** Obtener todos los clientes activos */
  getAllActive(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/activos`, this.getHeaders());
  }
  /** Obtener todos los clientes (activos e inactivos) */
  getAllSinFiltro(): Observable<Cliente[]> {
    return this.http.get<{ data: Cliente[] }>(`${this.apiUrl}`, this.getHeaders())
      .pipe(
        // extrae solo el array "data"
        map(response => response.data)
      );
  }

  /** Obtener todos los clientes (activos e inactivos) con paginación */
  getAllPaginado(
    page: number = 1,
    limit: number = 10,
    filtros?: any
  ): Observable<{
    data: Cliente[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    // Construir parámetros base
    let params: any = {
      page,
      limit,
    };

    // Agregar filtros si existen
    if (filtros) {
      if (filtros.nombre) params.nombre = filtros.nombre;
      if (filtros.rut) params.rut = filtros.rut;
      if (filtros.email) params.email = filtros.email;
      if (filtros.telefono) params.telefono = filtros.telefono;
      if (filtros.activo !== undefined && filtros.activo !== '') {
        params.activo = filtros.activo;
      }
    }

    // Crear opciones de headers + params
    const options = {
      ...this.getHeaders(),
      params,
    };

    return this.http.get<{
      data: Cliente[];
      total: number;
      page: number;
      totalPages: number;
    }>(`${this.apiUrl}`, options);
  }

  /** Obtener cliente por ID */
  getById(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  /** Obtener cliente por RUT */
  getByRut(rut: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/rut/${rut}`, this.getHeaders());
  }

  // Método para buscar clientes con filtro parcial usando SearchClienteDto
  buscarClientesParcial(rutParcial: string, limit = 10): Observable<Cliente[]> {
    const params = new HttpParams()
      .set('rut', rutParcial)
      .set('page', '1')
      .set('limit', limit.toString());

    // Nota: destructuramos tu objeto para pasarlo correctamente
    return this.http.get<{ data: Cliente[]; total: number; page: number; limit: number; totalPages: number }>(
      this.apiUrl,
      { ...this.getHeaders(), params } // <--- aquí se mezcla headers con params
    ).pipe(
      map(resp => resp.data || [])
    );
  }
  /** Crear un cliente */
  create(cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente, this.getHeaders());
  }

  /** Actualizar un cliente */
  update(id: number, cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.patch<Cliente>(`${this.apiUrl}/${id}`, cliente, this.getHeaders());
  }

  /** Activar cliente */
  activate(id: number): Observable<{ message: string, success: boolean, data: Cliente }> {
    return this.http.patch<{ message: string, success: boolean, data: Cliente }>(
      `${this.apiUrl}/activar/${id}`, {}, this.getHeaders()
    );
  }

  /** Desactivar cliente */
  deactivate(id: number): Observable<{ message: string, success: boolean, data: Cliente }> {
    return this.http.patch<{ message: string, success: boolean, data: Cliente }>(
      `${this.apiUrl}/desactivar/${id}`, {}, this.getHeaders()
    );
  }

  /** Eliminar cliente */
  remove(id: number): Observable<{ message: string, success: boolean }> {
    return this.http.delete<{ message: string, success: boolean }>(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  /** Helper: Obtener nombre completo según tipo de cliente */
  getNombreCompleto(cliente: Cliente): string {
    if (cliente.tipo_cliente === 'persona_natural') {
      return `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim();
    }
    return cliente.nombre_fantasia || cliente.razon_social || '';
  }

  autocomplete(query: string, limit: number = 10): Observable<ClienteAutocomplete[]> {
    const params = new HttpParams()
      .set('query', query)
      .set('limit', limit.toString());

    return this.http.get<ClienteAutocomplete[]>(
      `${this.apiUrl}/search`,
      {
        ...this.getHeaders(),
        params
      }
    );
  }

}