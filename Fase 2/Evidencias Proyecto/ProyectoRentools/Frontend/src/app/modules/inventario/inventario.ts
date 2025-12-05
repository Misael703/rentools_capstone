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

import { CarritoService } from './Services/carrito.service';
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
  // Listas principales
  listaHerramientas: Herramienta[] = [];
  listaFiltrada: Herramienta[] = []; // si no la usas, puedo ayudarte a eliminarla

  // Modales (cada uno con su selección propia)
  selectedDetalle?: Herramienta | null;
  selectedAccion?: Herramienta | null; // activar / desactivar
  selectedDisponibilidad?: Herramienta | null;

  // Filtros
  terminoBusqueda: string = '';
  soloActivos: boolean = false;

  // Disponibilidad
  cantidadSolicitada: number = 1;
  disponibilidadInfo: any = null;

  // Carrito
  herramientaSeleccionadaParaCarrito: Herramienta | null = null;
  cantidadCarrito: number = 1;
  diasCarrito: number = 1;
  errorCarrito: string = '';
  mostrarModalCarrito: boolean = false;

  // Carrito general
  verCarrito: boolean = false;
  itemsCarrito: any[] = [];

  // Modal de éxito pequeño (tipo toast)
  mensajeExito: string = '';
  mostrarModalExito: boolean = false;

  // Paginación
  page: number = 1;
  limit: number = 10;
  total: number = 0;
  totalPaginas: number = 0;

  cargando: boolean = false;

  get paginas(): number[] {
    const totalPaginas = Math.ceil(this.total / this.limit);
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  }

  constructor(
    private herramientasService: Inventory,
    private carritoService: CarritoService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadHerramientas();
  }
  // ======= Cargar listado =======
  loadHerramientas() {
    this.cargando = true;

    // Mapear tu input a los campos que acepta el backend
    const filtros: any = {
      nombre: this.terminoBusqueda.trim() || undefined,
      activo: this.soloActivos ? true : undefined,
      page: this.page,
      limit: this.limit
    };

    this.herramientasService.findAll(filtros).subscribe({
      next: (resp: any) => {
        // Lista principal
        this.listaHerramientas = resp.data || [];

        // Lista filtrada para el HTML
        this.listaFiltrada = [...this.listaHerramientas];

        // Total y total de páginas desde el meta del backend
        this.total = resp.meta?.total || 0;
        this.totalPaginas = resp.meta?.totalPages || Math.ceil(this.total / this.limit);

        this.cargando = false;
      },
      error: (err) => {
        console.error('ERROR findAll inventario:', err);
        this.listaHerramientas = [];
        this.listaFiltrada = [];
        this.total = 0;
        this.totalPaginas = 0;
        this.cargando = false;
      }
    });
  }

  cambiarPagina(direccion: 'anterior' | 'siguiente' | number) {
    if (direccion === 'anterior') {
      if (this.page > 1) this.page--;
    } else if (direccion === 'siguiente') {
      if (this.page < this.totalPaginas) this.page++;
    } else if (typeof direccion === 'number') {
      if (direccion >= 1 && direccion <= this.totalPaginas) this.page = direccion;
    }
    this.loadHerramientas();
  }
  aplicarFiltro() {
    this.page = 1;
    this.loadHerramientas();
  }

  // Cambiar filtro de activos
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
          nombre: this.terminoBusqueda || undefined,
          sku_bsale: this.terminoBusqueda || undefined,
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

  abrirModalCarrito(herramienta: any) {
    this.herramientaSeleccionadaParaCarrito = herramienta;
    this.diasCarrito = herramienta.dias_minimo;
    this.cantidadCarrito = 1;
    this.diasCarrito = 1;
    this.errorCarrito = '';
    this.mostrarModalCarrito = true;
  }

  cerrarModalCarrito() {
    this.mostrarModalCarrito = false;
    this.herramientaSeleccionadaParaCarrito = null;
  }

  agregarAlCarrito() {
    this.errorCarrito = '';

    if (!this.herramientaSeleccionadaParaCarrito) {
      this.errorCarrito = 'No se ha seleccionado ninguna herramienta.';
      return;
    }

    if (this.herramientaSeleccionadaParaCarrito.stock <= 0) {
      this.errorCarrito = 'Esta herramienta no tiene stock disponible.';
      return;
    }

    if (this.cantidadCarrito <= 0) {
      this.errorCarrito = 'La cantidad debe ser mayor a 0.';
      return;
    }

    if (this.cantidadCarrito > this.herramientaSeleccionadaParaCarrito.stock) {
      this.errorCarrito = `Solo hay ${this.herramientaSeleccionadaParaCarrito.stock} unidades disponibles.`;
      return;
    }

    if (this.diasCarrito < this.herramientaSeleccionadaParaCarrito.dias_minimo) {
      this.errorCarrito = `El mínimo de días para esta herramienta es ${this.herramientaSeleccionadaParaCarrito.dias_minimo}.`;
      return;
    }

    // Crear objeto compatible con contrato
    const item = {
      id: this.herramientaSeleccionadaParaCarrito.id_herramienta,
      id_herramienta: this.herramientaSeleccionadaParaCarrito.id_herramienta,
      nombre: this.herramientaSeleccionadaParaCarrito.nombre,
      cantidad: this.cantidadCarrito,
      dias_arriendo: this.diasCarrito,
      stock: this.herramientaSeleccionadaParaCarrito.stock
    };

    this.carritoService.agregarHerramienta(
      this.herramientaSeleccionadaParaCarrito,
      this.cantidadCarrito,
      this.diasCarrito
    );

    this.mostrarModalCarrito = false;
    this.mostrarExitoCarrito();
  }

  abrirCarrito() {
    this.itemsCarrito = this.carritoService.obtenerItems();
    this.verCarrito = true;
  }

  cerrarCarritoGeneral() {
    this.verCarrito = false;
  }

  eliminarDelCarrito(id: number) {
    this.carritoService.eliminarHerramienta(id);
    this.itemsCarrito = this.carritoService.obtenerItems();
  }

  mostrarExitoCarrito() {
    this.mensajeExito = 'Herramienta agregada al carrito con éxito.';
    this.mostrarModalExito = true;

    setTimeout(() => {
      this.mostrarModalExito = false;
    }, 2000);
  }

  irACrearContrato() {
    this.router.navigate(['/contratos/crear']);
  }

}
