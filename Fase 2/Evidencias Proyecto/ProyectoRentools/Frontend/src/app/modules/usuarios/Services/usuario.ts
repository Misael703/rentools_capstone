import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario, Rol } from '../Interfaces/usuario.interface';
@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://localhost:3000/api/usuario';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  getById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/id/${id}`);
  }

  create(usuario: Partial<Usuario> & { password: string }): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }

  update(id: number, usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}`, usuario);
  }

  activate(id: number): Observable<{ message: string; success: boolean; data: Usuario }> {
    return this.http.patch<{ message: string; success: boolean; data: Usuario }>(`${this.apiUrl}/activar/${id}`, {});
  }

  deactivate(id: number): Observable<{ message: string; success: boolean; data: Usuario }> {
    return this.http.patch<{ message: string; success: boolean; data: Usuario }>(`${this.apiUrl}/desactivar/${id}`, {});
  }

  remove(id: number): Observable<{ message: string; success: boolean }> {
    return this.http.delete<{ message: string; success: boolean }>(`${this.apiUrl}/${id}`);
  }

  getRolNombre(usuario: Usuario): string {
    return usuario.rol?.nombre || 'Desconocido';
  }
}

// Exportar los tipos para otros módulos
export type { Usuario, Rol };