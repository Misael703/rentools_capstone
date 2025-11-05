import { Component, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgFor, RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  cards = [
    { title: 'Inventario', description: 'Gestionar productos', icon: 'bi bi-tools', link: '/inventario' },
    { title: 'Contratos', description: 'Gestionar contratos', icon: 'bi bi-file-earmark-text', link: '/contratos' },
    { title: 'Clientes', description: 'Gestionar clientes', icon: 'bi bi-people', link: '/clientes' },
    { title: 'Pagos', description: 'Ver pagos', icon: 'bi bi-coin', link: '/pagos' },
    { title: 'Devoluciones', description: 'Registrar devoluciones', icon: 'bi bi-cash', link: '/devoluciones' },
    { title: 'Reportes', description: 'Ver reportes', icon: 'bi bi-bar-chart-line', link: '/reportes' },
    { title: 'Usuarios', description: 'Gestionar usuarios', icon: 'bi bi-person-gear', link: '/usuarios', role: 'admin' }
  ];

  filteredCards: any[] = [];

  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    // 🔹 Obtener el nombre del rol (por ejemplo, 'admin')
    const role = user?.rol?.nombre || user?.rol || '';

    console.log('👤 Rol detectado en Home:', role);

    this.filteredCards = this.cards.filter(card => !card.role || card.role === role);
  }
}
