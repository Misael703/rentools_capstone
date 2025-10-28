import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

export interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
  password: string;
  id_rol: number;
  activo: boolean;
}

export interface Rol {
  id_rol: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})

export class UsuarioService {
  private roles: Rol[] = [
    { id_rol: 1, nombre: 'Admin' },
    { id_rol: 2, nombre: 'Bodeguero' },
    { id_rol: 3, nombre: 'Vendedor' }
  ];

  private usuariosIniciales: Usuario[] = [
    { id_usuario: 1, nombre: 'Carlos', email: 'carlos@test.com', password: '1234', id_rol: 1, activo: true },
    { id_usuario: 2, nombre: 'Ana', email: 'ana@test.com', password: 'abcd', id_rol: 2, activo: true },
    { id_usuario: 3, nombre: 'Luis', email: 'luis@test.com', password: 'qwerty', id_rol: 3, activo: false }
  ];

  private data$ = new BehaviorSubject<Usuario[]>(this.usuariosIniciales);

  getAll(): Observable<Usuario[]> {
    return this.data$.asObservable();
  }

  getById(id_usuario: number): Observable<Usuario | undefined> {
    const user = this.data$.getValue().find(u => u.id_usuario === id_usuario);
    return of(user);
  }

  create(usuario: Usuario): Observable<boolean> {
    const arr = this.data$.getValue();
    if (arr.find(u => u.id_usuario === usuario.id_usuario)) {
      return of(false);
    }
    arr.push(usuario);
    this.data$.next(arr);
    return of(true);
  }

  update(usuarioActualizado: Usuario): Observable<boolean> {
    const arr = this.data$.getValue().map(u => u.id_usuario === usuarioActualizado.id_usuario ? usuarioActualizado : u);
    this.data$.next(arr);
    return of(true);
  }

  toggleActivo(id_usuario: number): Observable<boolean> {
    const arr = this.data$.getValue().map(u => {
      if (u.id_usuario === id_usuario) u.activo = !u.activo;
      return u;
    });
    this.data$.next(arr);
    return of(true);
  }

  getRolNombre(id_rol: number): string {
    return this.roles.find(r => r.id_rol === id_rol)?.nombre || 'Desconocido';
  }
}

