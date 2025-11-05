import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  sidebarItems = [
    { title: 'Home', link: '/home', icon: 'bi bi-house' },
    { title: 'Inventario', link: '/inventario', icon: 'bi bi-tools' },
    { title: 'Contratos', link: '/contratos', icon: 'bi bi-file-earmark-text' },
    { title: 'Clientes', link: '/clientes', icon: 'bi bi-people' },
    { title: 'Pagos', link: '/pagos', icon: 'bi bi-coin' },
    { title: 'Devoluciones', link: '/devoluciones', icon: 'bi bi-cash' },
    { title: 'Reportes', link: '/reportes', icon: 'bi bi-bar-chart-line' },
    { title: 'Usuarios', link: '/usuarios', icon: 'bi bi-person-gear', role: 'admin' }
  ];

  filteredSidebar: any[] = [];
  user: any = null;
  mostrarTarjeta = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    this.user = userData ? JSON.parse(userData) : null;
    const role = this.user?.rol?.nombre || '';

    // Filtrar items del sidebar según rol
    this.filteredSidebar = this.sidebarItems.filter(item => !item.role || item.role === role);
  }

  toggleTarjeta(): void {
    this.mostrarTarjeta = !this.mostrarTarjeta;
  }

  cerrarSesion(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}