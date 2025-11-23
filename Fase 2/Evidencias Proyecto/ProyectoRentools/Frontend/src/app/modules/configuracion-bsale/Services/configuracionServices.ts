import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BsaleProductCached, BsaleProductCachedResponse, BsaleProductConfig } from '../interfaces/configuracionInterface';

@Injectable({
    providedIn: 'root'
})
export class BsaleProductsService {
    private apiBaseUrl = 'http://localhost:3000/api/bsale/';

    constructor(private http: HttpClient) { }

    // Obtener todos los productos cacheados (con paginación opcional)
    getAllCachedProducts(limit: number = 50, offset: number = 0): Observable<BsaleProductCachedResponse> {
        return this.http.get<BsaleProductCachedResponse>(`${this.apiBaseUrl}products/cached?limit=${limit}&offset=${offset}`);
    }

    // Buscar productos en cache
    searchCachedProducts(query: string, limit: number, offset: number) {
        return this.http.get<BsaleProductCached[]>(`${this.apiBaseUrl}products/search?q=${query}&limit=${limit}&offset=${offset}`);
    }

    // Obtener productos en configuración actual
    getConfiguredProducts(): Observable<BsaleProductConfig[]> {
        return this.http.get<BsaleProductConfig[]>(`${this.apiBaseUrl}products-config`);
    }

    // Añadir producto a configuración
    addProductToConfig(productId: number): Observable<any> {
        return this.http.post(`${this.apiBaseUrl}products-config/${productId}`, {});
    }

    // Eliminar producto de configuración
    removeProductFromConfig(configId: number): Observable<any> {
        return this.http.delete(`${this.apiBaseUrl}products-config/${configId}`);
    }
}