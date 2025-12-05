import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
    Devolucion,
    CreateDevolucionDto,
    CreateDevolucionMasivaDto,
    UpdateDevolucionDto,
    SearchDevolucionDto,
    ApiResponse,
    PaginationResponse,
} from '../interfaces/devolucion.interfaces';

@Injectable({
    providedIn: 'root',
})
export class DevolucionesService {
    // Ajusta la base si tu API no usa /api
    private readonly apiUrl = 'http://localhost:3000/api/devoluciones';

    constructor(private http: HttpClient) { }

    // ---------------------------
    // Helpers
    // ---------------------------
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

        Object.keys(filters).forEach((key) => {
            const val = (filters as any)[key];
            if (val !== undefined && val !== null && val !== '') {
                params = params.set(key, val.toString());
            }
        });

        return params;
    }

    // ---------------------------
    // 1) POST /devoluciones
    // Crear una devolución individual
    // ---------------------------
    create(createDto: CreateDevolucionDto): Observable<ApiResponse<Devolucion>> {
        return this.http.post<ApiResponse<Devolucion>>(
            `${this.apiUrl}`,
            createDto,
            this.getHeaders()
        );
    }

    // ---------------------------
    // 2) POST /devoluciones/masiva
    // Crear devoluciones masivas (array)
    // ---------------------------
    createMasiva(
        dto: CreateDevolucionMasivaDto
    ): Observable<ApiResponse<{ devoluciones: Devolucion[]; resumen: any }>> {
        return this.http.post<ApiResponse<{ devoluciones: Devolucion[]; resumen: any }>>(
            `${this.apiUrl}/masiva`,
            dto,
            this.getHeaders()
        );
    }

    // ---------------------------
    // 3) GET /devoluciones/contrato/:id_contrato/resumen
    // Obtener resumen completo del contrato (herramientas, totales, progreso)
    // Retorna estructura del backend (usar any o tipar en interfaces)
    // ---------------------------
    getResumenContrato(id_contrato: number): Observable<any> {
        return this.http.get<any>(
            `${this.apiUrl}/contrato/${id_contrato}/resumen`,
            this.getHeaders()
        );
    }

    // ---------------------------
    // 4) GET /devoluciones/contrato/:id_contrato
    // Obtener todas las devoluciones de un contrato
    // ---------------------------
    findByContrato(id_contrato: number): Observable<Devolucion[]> {
        return this.http.get<Devolucion[]>(
            `${this.apiUrl}/contrato/${id_contrato}`,
            this.getHeaders()
        );
    }

    // ---------------------------
    // 5) GET /devoluciones
    // Listar devoluciones con filtros y paginación
    // Query params: page, limit, id_contrato, estado, fecha_devolucion
    // ---------------------------
    findAll(filters?: SearchDevolucionDto): Observable<PaginationResponse<Devolucion>> {
        const params = this.buildParams(filters as any);

        // Nota: el controller retorna { data, meta } — ajusta PaginationResponse si tu shape es distinto
        return this.http.get<PaginationResponse<Devolucion>>(this.apiUrl, {
            headers: this.getHeaders().headers,
            params,
        });
    }

    // ---------------------------
    // 6) GET /devoluciones/:id
    // Obtener una devolución específica con relaciones
    // ---------------------------
    findOne(id: number): Observable<ApiResponse<Devolucion>> {
        return this.http.get<ApiResponse<Devolucion>>(
            `${this.apiUrl}/${id}`,
            this.getHeaders()
        );
    }

    // ---------------------------
    // 7) PATCH /devoluciones/:id
    // Actualiza solo estado u observaciones
    // ---------------------------
    update(id: number, dto: UpdateDevolucionDto) {
        return this.http.patch<Devolucion>(`${this.apiUrl}/${id}`, dto, this.getHeaders());
    }
}