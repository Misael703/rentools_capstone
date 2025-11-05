import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRoles = route.data['roles'] as string[];
    const user = this.authService.getUser();

    if (!user) {
      console.warn('🚫 Usuario no autenticado');
      this.router.navigate(['/login']);
      return false;
    }

    // 🔹 Si el backend devuelve el rol como objeto, tomamos user.rol.nombre
    const userRole = user.rol?.nombre || user.rol;

    console.log('👤 Rol del usuario:', userRole);
    console.log('🔒 Roles permitidos:', expectedRoles);

    // Verificamos si el rol del usuario está dentro de los permitidos
    if (!expectedRoles.includes(userRole)) {
      console.warn('⛔ Acceso denegado para rol:', userRole);
      this.router.navigate(['/home']);
      return false;
    }

    console.log('✅ Acceso permitido');
    return true;
  }
}