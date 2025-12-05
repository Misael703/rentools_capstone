import { Component, OnInit } from '@angular/core';
import { PagosService } from '../pagos/services/pago.services';
import {
  Pago,
  SearchPago,
  PaginatedPagos,
  MetodoPago,
} from '../pagos/interfaces/pago.interfaces';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-pagos',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './pagos.html',
  styleUrl: './pagos.css',
})
export class Pagos implements OnInit {

  // Lista de pagos
  pagos: Pago[] = [];

  // Formulario de filtros
  filtrosForm!: FormGroup;

  // Paginación
  page = 1;
  limit = 10;
  totalPagos = 0;

  // Datos auxiliares
  loading = false;
  metodosPago = Object.values(MetodoPago);

  // Variables
  modalDetalleAbierto = false;
  pagoDetalle: Pago | null = null;

  modalEditarAbierto = false;
  pagoEditarId: number | null = null;
  editarReferenciaForm!: FormGroup;

  constructor(private pagosService: PagosService, private fb: FormBuilder) { }

  ngOnInit(): void {
    this.initForm();
    this.obtenerPagos();
  }

  // -------------------------------------------------------
  // Inicializa formulario de filtros
  // -------------------------------------------------------
  initForm(): void {
    this.filtrosForm = this.fb.group({
      id_contrato: [''],
      metodo_pago: [''],
      fecha_desde: [''],
      fecha_hasta: [''],
    });
  }

  // -------------------------------------------------------
  // Carga la lista de pagos según filtros y paginación
  // -------------------------------------------------------
  obtenerPagos(): void {
    this.loading = true;

    const filtros: SearchPago = {
      page: this.page,
      limit: this.limit,
      ...this.filtrosForm.value,
    };

    this.pagosService.findAll(filtros).subscribe({
      next: (resp: PaginatedPagos) => {
        this.pagos = resp.data;
        this.totalPagos = resp.total;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando pagos:', err);
        this.loading = false;
      },
    });
  }

  // -------------------------------------------------------
  // Aplicar filtros desde el formulario
  // -------------------------------------------------------
  aplicarFiltros(): void {
    this.page = 1;
    this.obtenerPagos();
  }

  // -------------------------------------------------------
  // Limpiar filtros
  // -------------------------------------------------------
  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.page = 1;
    this.obtenerPagos();
  }

  // -------------------------------------------------------
  // Paginación (siguiente página)
  // -------------------------------------------------------
  siguientePagina(): void {
    if (this.page * this.limit < this.totalPagos) {
      this.page++;
      this.obtenerPagos();
    }
  }

  // -------------------------------------------------------
  // Paginación (página anterior)
  // -------------------------------------------------------
  paginaAnterior(): void {
    if (this.page > 1) {
      this.page--;
      this.obtenerPagos();
    }
  }

  // -------------------------------------------------------
  // Formato de fecha para mostrar bonito
  // -------------------------------------------------------
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-CL');
  }

  // -------------------------------------------------------
  // Eliminar un pago
  // -------------------------------------------------------
  eliminarPago(id_pago: number): void {
    if (!confirm('¿Seguro que deseas eliminar este pago?')) return;

    this.pagosService.delete(id_pago).subscribe({
      next: () => {
        this.obtenerPagos();
      },
      error: (err) => {
        console.error('Error al eliminar pago:', err);
      },
    });
  }

  // Abrir modal detalle
  abrirDetallePago(id_pago: number) {
    this.pagosService.findOne(id_pago).subscribe({
      next: (pago) => {
        this.pagoDetalle = pago;
        this.modalDetalleAbierto = true;
      },
      error: (err) => console.error('Error cargando pago:', err)
    });
  }

  cerrarModalDetalle() {
    this.modalDetalleAbierto = false;
    this.pagoDetalle = null;
  }

  // Abrir modal editar referencia
  abrirEditarReferencia(id_pago: number, referencia: string | null) {
    this.pagoEditarId = id_pago;
    this.editarReferenciaForm = this.fb.group({
      referencia: [referencia || '', Validators.required]
    });
    this.modalEditarAbierto = true;
  }

  cerrarModalEditar() {
    this.modalEditarAbierto = false;
    this.pagoEditarId = null;
  }

  // Guardar referencia
  guardarReferencia() {
    if (!this.pagoEditarId) return;
    if (this.editarReferenciaForm.invalid) return;

    const dto = { referencia: this.editarReferenciaForm.value.referencia };

    this.pagosService.update(this.pagoEditarId, dto).subscribe({
      next: (pagoActualizado) => {
        // Actualizar en la tabla al instante
        const index = this.pagos.findIndex(p => p.id_pago === this.pagoEditarId);
        if (index >= 0) this.pagos[index].referencia = pagoActualizado.referencia;

        this.cerrarModalEditar();
      },
      error: (err) => console.error('Error actualizando referencia:', err)
    });
  }

}
