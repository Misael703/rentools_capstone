import { Component, OnInit } from '@angular/core';
import { ContratosService } from '../contratos/Services/contrato.service';
import {
  Contrato,
  EstadoContrato,
  TipoEntrega,
  SearchContratoDto,
  UpdateContratoDto,
} from './Interfaces/contrato.interfaces';

import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
@Component({
  selector: 'app-contratos',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './contratos.html',
  styleUrl: './contratos.css',
})
export class Contratos implements OnInit {
  contratos: Contrato[] = [];
  cargando = false;

  // PAGINACIÓN
  paginaActual = 1;
  limite = 10;
  total = 0;
  totalPaginas = 0;

  // FILTROS
  filtroClienteNombre = '';
  filtroRut = '';
  filtroEstado: EstadoContrato | '' = '';
  filtroEntrega: TipoEntrega | '' = '';
  filtroFechaDesde = '';
  filtroFechaHasta = '';

  // MODALES
  mostrarModal = false;
  contratoSeleccionado: Contrato | null = null;

  mostrarModalConfirmar = false;
  tipoAccion: 'finalizar' | 'cancelar' | 'editar' | null = null;
  contratoAccion: Contrato | null = null;

  // Editar
  mostrarModalEditar = false;
  contratoEditar: Contrato | null = null;
  updateContratoData: UpdateContratoDto = {};

  mostrarModalExitoEditar = false;

  contratosFiltrados: Contrato[] = [];

  constructor(
    private contratosService: ContratosService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.obtenerContratos();
  }

  // ======================================================
  // Obtener contratos con filtros y paginación
  // ======================================================
  obtenerContratos(): void {
    this.cargando = true;

    const filtros: SearchContratoDto = {
      page: this.paginaActual,
      limit: this.limite
    };

    this.contratosService.findAll(filtros).subscribe({
      next: (response: any) => {
        this.contratos = response.data;

        // Ahora total y totalPaginas vienen del backend
        this.total = response.meta.total;
        this.totalPaginas = response.meta.totalPages;

        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al obtener contratos:', err);
        this.cargando = false;
      }
    });
  }

  // ======================================================
  // Paginación
  // ======================================================
  cambiarPagina(dir: 'anterior' | 'siguiente'): void {
    if (dir === 'anterior' && this.paginaActual > 1) {
      this.paginaActual--;
    }
    if (dir === 'siguiente' && this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
    this.obtenerContratos();
  }

  // ======================================================
  // Filtros
  // ======================================================
  aplicarFiltros(): void {
  this.paginaActual = 1; // reinicia a la primera página

  const filtros: SearchContratoDto = {
  page: this.paginaActual,
  limit: this.limite,
  estado: this.filtroEstado || undefined,  // <-- aquí
  tipo_entrega: this.filtroEntrega || undefined,
  fecha_inicio_desde: this.filtroFechaDesde || undefined,
  fecha_inicio_hasta: this.filtroFechaHasta || undefined
};

  this.contratosService.findAll(filtros).subscribe({
    next: (response: any) => {
      this.contratos = response.data;
      this.total = response.meta.total;
      this.totalPaginas = response.meta.totalPages;
    },
    error: (err) => console.error(err)
  });
}

  limpiarFiltros(): void {
    this.filtroClienteNombre = '';
    this.filtroRut = '';
    this.filtroEstado = '';
    this.filtroEntrega = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';

    this.aplicarFiltros();
  }

  // ======================================================
  // Acciones de contrato
  // ======================================================
  crearContrato(): void {
    this.router.navigate(['/contratos/crear']);
  }

  verDetalles(contrato: Contrato): void {
    this.contratoSeleccionado = contrato;
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.contratoSeleccionado = null;
  }

  // Solicitar acción: finalizar, cancelar o editar
  solicitarAccion(tipo: 'finalizar' | 'cancelar' | 'editar', contrato: Contrato): void {
    if (tipo === 'editar') {
      this.abrirModalEditar(contrato);
      return;
    }

    this.tipoAccion = tipo;
    this.contratoAccion = contrato;
    this.mostrarModalConfirmar = true;
  }

  // ======================================================
  // Confirmar acción seleccionada
  // ======================================================
  confirmarAccion(): void {
    if (!this.tipoAccion || !this.contratoAccion) return;

    const id = this.contratoAccion.id_contrato;
    let peticion: Observable<any> | null = null;

    if (this.tipoAccion === 'cancelar') {
      peticion = this.contratosService.remove(id); // eliminar y cancelar es lo mismo
    }

    if (this.tipoAccion === 'finalizar') {
      peticion = this.contratosService.finalizar(id);
    }

    if (!peticion) return;

    peticion.subscribe({
      next: () => {
        this.cerrarModalAccion();
        this.obtenerContratos();
      },
      error: (err) => console.error('Error en acción:', err)
    });
  }

  cerrarModalAccion(): void {
    this.mostrarModalConfirmar = false;
    this.tipoAccion = null;
    this.contratoAccion = null;
  }

  // ======================================================
  // MODAL EDITAR
  // ======================================================
  // Abrir modal de edición
  abrirModalEditar(contrato: Contrato): void {
    this.contratoEditar = contrato;
    this.updateContratoData = {
      tipo_entrega: contrato.tipo_entrega,
      observaciones: contrato.observaciones ?? undefined,
      monto_garantia: contrato.monto_garantia ?? undefined
    };
    this.mostrarModalEditar = true;
  }

  // Cerrar modal de edición
  cerrarModalEditar(): void {
    this.mostrarModalEditar = false;
    this.contratoEditar = null;
    this.updateContratoData = {};
  }

  // Guardar cambios del contrato editado
  guardarEdicion(): void {
    if (!this.contratoEditar) return;

    this.contratosService.update(this.contratoEditar.id_contrato, this.updateContratoData)
      .subscribe({
        next: (res) => {
          this.cerrarModalEditar();
          this.obtenerContratos();

          // Mostrar modal de éxito
          this.mostrarModalExitoEditar = true;
        },
        error: (err) => console.error('Error al actualizar contrato:', err)
      });
  }

  aceptarExitoEditar(): void {
    this.mostrarModalExitoEditar = false;
  }

}
