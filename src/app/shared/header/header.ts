import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgFor } from '@angular/common'; 
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, NgFor],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
sidebarItems = [
  { title: 'Home', link: '/home', icon: 'bi bi-house' },
  { title: 'Inventario', link: '/inventario', icon: 'bi bi-tools' },
  { title: 'Contratos', link: '/contratos', icon: 'bi bi-file-earmark-text' },
  { title: 'Clientes', link: '/clientes', icon: 'bi bi-people' },
  { title: 'Pagos', link: '/pagos', icon: 'bi bi-coin' },
  { title: 'Devoluciones', link: '/devoluciones', icon: 'bi bi-cash' },
  { title: 'Reportes', link: '/reportes', icon: 'bi bi-bar-chart-line' },
  { title: 'Usuarios', link: '/usuarios', icon: 'bi bi-person-gear' }
];
}
