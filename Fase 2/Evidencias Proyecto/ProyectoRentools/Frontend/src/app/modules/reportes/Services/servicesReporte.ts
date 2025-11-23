import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClienteReporte, EstadisticasClientes, EstadisticasHerramientas } from '../Interfaces/interfaceReporte';
import { ClientesService } from '../../clientes/Services/cliente.service';

@Injectable({
    providedIn: 'root'
})
export class ReportesService {
    private apiBaseUrl = 'http://localhost:3000/api/'; // Base URL común

    constructor(private http: HttpClient, private clientesService: ClientesService) { }

    // Endpoint para obtener todos los clientes
    getClientes(): Observable<ClienteReporte[]> {
        return this.clientesService.getAllSinFiltro();
    }

    // Endpoint para obtener estadísticas de clientes
    getEstadisticas(): Observable<EstadisticasClientes> {
        return this.http.get<EstadisticasClientes>(`${this.apiBaseUrl}clientes/stats`);
    }

    // NUEVO: Estadísticas de herramientas
    getEstadisticasHerramientas(): Observable<EstadisticasHerramientas> {
        return this.http.get<EstadisticasHerramientas>(`${this.apiBaseUrl}herramientas/stats`);
    }
}