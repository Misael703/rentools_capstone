import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Inventory } from './Services/inventory';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  Herramienta,
  CreateHerramientaForm,
  UpdateHerramientaForm,
} from './Interfaces/inventario.interface';

import * as ExcelJS from 'exceljs';
import * as FileSaver from 'file-saver';

declare var bootstrap: any;
@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css',
})
export class Inventario implements OnInit {
  listaHerramientas: Herramienta[] = [];
  listaFiltrada: Herramienta[] = [];

  // variables para cada modal (separadas)
  selectedDetalle?: Herramienta | null;
  selectedAccion?: Herramienta | null; // para activar/desactivar
  selectedDisponibilidad?: Herramienta | null;

  terminoBusqueda = '';
  soloActivos = false;

  cantidadSolicitada = 1;
  disponibilidadInfo: any = null;

  page = 1;
  limit = 10;
  total = 0;

  get paginas(): number[] {
    const totalPaginas = Math.ceil(this.total / this.limit);
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  }

  constructor(
    private herramientasService: Inventory,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadHerramientas();
  }

  // ======= Cargar listado =======
  loadHerramientas() {
    this.herramientasService.findAll({
      search: this.terminoBusqueda || undefined,
      activo: this.soloActivos ? true : undefined,
      page: this.page,
      limit: this.limit
    }).subscribe({
      next: (resp: any) => {
        this.listaHerramientas = resp.data || [];
        // backend tuyo devolvía "meta" en vez de "total" en la raíz
        this.total = resp.meta?.total ?? resp.total ?? 0;
        this.aplicarFiltro();
      },
      error: (err) => {
        console.error('Error al cargar herramientas', err);
        this.listaHerramientas = [];
        this.listaFiltrada = [];
        this.total = 0;
      }
    });
  }

  cambiarPagina(nuevaPagina: number) {
    const totalPaginas = Math.ceil(this.total / this.limit) || 1;
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    this.page = nuevaPagina;
    this.loadHerramientas();
  }

  aplicarFiltro() {
    const termino = this.terminoBusqueda?.toLowerCase().trim() || '';

    this.listaFiltrada = this.listaHerramientas.filter(h => {
      const nombre = (h.nombre || '').toLowerCase();
      const sku = (h.sku_bsale || '').toLowerCase();
      const coincide = nombre.includes(termino) || sku.includes(termino);
      const esActivo = this.soloActivos ? h.activo === true : true;
      return coincide && esActivo;
    });
  }

  toggleFiltroActivos() {
    this.soloActivos = !this.soloActivos;
    this.page = 1;
    this.loadHerramientas();
  }

  // ================= Detalle (BOOTSTRAP modal) =================
  abrirDetalle(herr: Herramienta) {
    this.selectedDetalle = herr;
    const el = document.getElementById('modalDetalleHerramienta');
    if (!el) return;
    new bootstrap.Modal(el).show();
  }

  cerrarDetalle() {
    const el = document.getElementById('modalDetalleHerramienta');
    if (el) {
      const modal = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
      modal.hide();
    }
    this.selectedDetalle = undefined;
  }

  // ================= Activar =================
  abrirModalActivar(herr: Herramienta) {
    this.selectedAccion = herr;
    const el = document.getElementById('modalActivarHerramienta');
    if (!el) return;
    new bootstrap.Modal(el).show();
  }

  confirmarActivar() {
    if (!this.selectedAccion) return;
    this.herramientasService.activar(this.selectedAccion.id_herramienta)
      .subscribe({
        next: () => {
          const el = document.getElementById('modalActivarHerramienta');
          if (el) {
            const modal = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
            modal.hide();
          }
          this.selectedAccion = undefined;
          this.loadHerramientas();
        },
        error: (err) => {
          console.error(err);
          alert('Error al activar la herramienta');
        }
      });
  }

  // ================= Desactivar =================
  abrirModalDesactivar(herr: Herramienta) {
    this.selectedAccion = herr;
    const el = document.getElementById('modalDesactivarHerramienta');
    if (!el) return;
    new bootstrap.Modal(el).show();
  }

  confirmarDesactivar() {
    if (!this.selectedAccion) return;
    this.herramientasService.remove(this.selectedAccion.id_herramienta)
      .subscribe({
        next: () => {
          const el = document.getElementById('modalDesactivarHerramienta');
          if (el) {
            const modal = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
            modal.hide();
          }
          this.selectedAccion = undefined;
          this.loadHerramientas();
        },
        error: (err) => {
          console.error(err);
          alert('Error al desactivar la herramienta');
        }
      });
  }

  // ================= Disponibilidad =================
  abrirModalDisponibilidad(herr: Herramienta) {
    this.selectedDisponibilidad = herr;
    this.cantidadSolicitada = 1;
    this.disponibilidadInfo = null;
    const el = document.getElementById('modalDisponibilidad');
    if (!el) return;
    new bootstrap.Modal(el).show();
  }

  consultarDisponibilidad() {
    if (!this.selectedDisponibilidad) return;
    this.herramientasService.checkDisponibilidad(
      this.selectedDisponibilidad.id_herramienta,
      this.cantidadSolicitada
    ).subscribe({
      next: (resp) => {
        this.disponibilidadInfo = resp;
      },
      error: (err) => {
        console.error(err);
        alert('Error consultando disponibilidad');
      }
    });
  }

  // ================= Navegación / Export =================
  irCrear() { this.router.navigate(['/inventario/crear']); }
  irEditar(id: number) { this.router.navigate(['/inventario/editar/', id]); }

  async exportarExcel() {
    try {
      let todasHerramientas: Herramienta[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const resp: any = await this.herramientasService.findAll({
          search: this.terminoBusqueda || undefined,
          activo: this.soloActivos ? true : undefined,
          page,
          limit: 10, // Límite que acepta tu backend
        }).toPromise();

        todasHerramientas = [...todasHerramientas, ...resp.data];
        totalPages = resp.meta.totalPages; // según tu respuesta JSON de Postman
        page++;
      } while (page <= totalPages);

      // Crear el Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Herramientas');

      worksheet.columns = [
        { header: 'SKU Bsale', key: 'sku_bsale', width: 20 },
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Descripción', key: 'descripcion', width: 40 },
        { header: 'Precio Diario', key: 'precio_diario', width: 15 },
        { header: 'Garantía', key: 'garantia', width: 12 },
        { header: 'Días Mínimo', key: 'dias_minimo', width: 12 },
        { header: 'Stock', key: 'stock', width: 10 },
        { header: 'Activo', key: 'activo', width: 10 },
      ];

      todasHerramientas.forEach((h: Herramienta) => {
        worksheet.addRow({
          sku_bsale: h.sku_bsale,
          nombre: h.nombre,
          descripcion: h.descripcion,
          precio_diario: h.precio_diario,
          garantia: h.garantia,
          dias_minimo: h.dias_minimo,
          stock: h.stock,
          activo: h.activo ? 'Sí' : 'No',
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      FileSaver.saveAs(blob, 'Herramientas.xlsx');

    } catch (err) {
      console.error('Error al exportar herramientas', err);
      alert('No se pudieron exportar las herramientas.');
    }
  }
}
