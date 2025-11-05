import { Component, OnInit } from '@angular/core';
import { ClientesService } from '../clientes/Services/cliente.service';
import { Cliente } from '../clientes/Interfaces/cliente.interfaces';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-clientes',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes implements OnInit {
  clientes: Cliente[] = [];
  cargando = false;

  // Paginación
  paginaActual = 1;
  limite = 10;
  totalClientes = 0;
  totalPaginas = 0;

  // Filtros
  filtroBusqueda = ''; // nombre completo / razón social
  filtroRut = '';
  filtroActivo: string = ''; // '', 'true', 'false'

  mostrarModal = false;
  clienteSeleccionado: Cliente | null = null;

  constructor(
    private clientesService: ClientesService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.obtenerClientes();
  }

  obtenerClientes(): void {
    this.cargando = true;

    const filtros: any = {
      nombre: this.filtroBusqueda,
      rut: this.filtroRut,
    };

    // 🔹 Manejo correcto del estado activo/inactivo
    if (this.filtroActivo !== '') {
      filtros.activo = this.filtroActivo === 'true' ? true : false;
    }

    this.clientesService
      .getAllPaginado(this.paginaActual, this.limite, filtros)
      .subscribe({
        next: (response) => {
          this.clientes = response.data;
          this.totalClientes = response.total;
          this.totalPaginas = response.totalPages;
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error al obtener clientes:', err);
          this.cargando = false;
        },
      });
  }
  cambiarPagina(direccion: 'anterior' | 'siguiente'): void {
    if (direccion === 'anterior' && this.paginaActual > 1) {
      this.paginaActual--;
    } else if (direccion === 'siguiente' && this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
    this.obtenerClientes();
  }

  aplicarFiltros(): void {
    this.paginaActual = 1;
    this.obtenerClientes();
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroRut = '';
    this.filtroActivo = '';
    this.aplicarFiltros();
  }

  crearCliente(): void {
    this.router.navigate(['/clientes/crear']);
  }

  editarCliente(id: number): void {
    this.router.navigate(['/clientes/editar', id]);
  }

  nombreCompleto(cliente: Cliente): string {
    return this.clientesService.getNombreCompleto(cliente);
  }

  toggleActivo(cliente: Cliente): void {
    const accion = cliente.activo
      ? this.clientesService.deactivate(cliente.id_cliente)
      : this.clientesService.activate(cliente.id_cliente);

    accion.subscribe({
      next: () => this.obtenerClientes(),
      error: (err) => console.error('Error al cambiar estado del cliente:', err),
    });
  }

  eliminarCliente(cliente: Cliente): void {
    if (confirm(`¿Estás seguro de eliminar al cliente ${this.nombreCompleto(cliente)}?`)) {
      this.clientesService.remove(cliente.id_cliente).subscribe({
        next: () => this.obtenerClientes(),
        error: (err) => console.error('Error al eliminar cliente:', err),
      });
    }
  }

  verDetalles(cliente: Cliente): void {
    this.clienteSeleccionado = cliente;
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.clienteSeleccionado = null;
  }
}
