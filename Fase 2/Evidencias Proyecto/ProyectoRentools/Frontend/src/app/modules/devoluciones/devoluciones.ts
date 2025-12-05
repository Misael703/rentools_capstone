import { Component, OnInit } from '@angular/core';
import { DevolucionesService } from '../devoluciones/services/devoluciones.service';
import { ContratosService } from '../contratos/Services/contrato.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Devolucion,
  Contrato, SearchDevolucionDto,
  CreateDevolucionDto,
  CreateDevolucionMasivaDto,
  UpdateDevolucionDto,
  EstadoDevolucion,
  PaginationResponse,
} from '../devoluciones/interfaces/devolucion.interfaces';
import { Router } from '@angular/router';

@Component({
  selector: 'app-devoluciones',
  imports: [CommonModule, FormsModule],
  templateUrl: './devoluciones.html',
  styleUrl: './devoluciones.css',
})
export class Devoluciones implements OnInit {

  // ================================
  // DATA
  // ================================
  contratosActivos: Contrato[] = [];
  devoluciones: Devolucion[] = [];
  devolucionSeleccionada?: Devolucion;
  devolucionesFiltradas: Devolucion[] = [];

  paginaActual: number = 1;
  totalPaginas: number = 1;
  limit = 10;

  // Para contratos
  paginaActualContratos: number = 1;
  totalPaginasContratos: number = 1;

  // Para devoluciones
  paginaActualDevoluciones: number = 1;
  totalPaginasDevoluciones: number = 1;

  sugerenciasDevoluciones: Devolucion[] = [];


  loadingContratos = false;
  loadingDevoluciones = false;

  detalleDevolucionesContrato: Devolucion[] = [];
  mostrarModalDetalle = false;

  // Para mostrar modal
  mostrarModalResumen: boolean = false;

  // Para almacenar la info del resumen
  resumenContrato: any = null;
  herramientasResumen: any[] = [];

  // ================================
  // FILTROS
  // ================================
  filtros: SearchDevolucionDto = {
    page: 1,
    limit: 10,
    estado: undefined,
    id_contrato: undefined,
    fecha_devolucion: undefined,
  };

  estados = [
    { value: null, label: 'Todos' },
    { value: EstadoDevolucion.BUEN_ESTADO, label: 'Buen estado' },
    { value: EstadoDevolucion.DANADA, label: 'Dañada' },
    { value: EstadoDevolucion.REPARACION_MENOR, label: 'Reparación menor' },
  ];

  constructor(
    private contratosService: ContratosService,
    private devolucionesService: DevolucionesService,
    private router: Router
  ) { }

  // ================================
  // INIT
  // ================================
  ngOnInit(): void {
    this.cargarContratosActivos();
    this.cargarDevoluciones();
  }

  // ================================
  // 1) LISTAR CONTRATOS ACTIVOS
  // ================================
  cargarContratosActivos(pagina: number = 1): void {
    if (pagina < 1 || (this.totalPaginasContratos && pagina > this.totalPaginasContratos)) return;

    this.loadingContratos = true;
    this.paginaActualContratos = pagina;

    this.contratosService.obtenerContratosActivos(this.paginaActualContratos, this.limit)
      .subscribe({
        next: (resp) => {
          this.contratosActivos = resp.data;
          console.log('Contratos recibidos del backend:', resp.data);

          this.totalPaginasContratos = resp.meta?.totalPages ?? 1;
          this.paginaActualContratos = resp.meta?.page ?? 1;

          this.loadingContratos = false;
        },
        error: () => {
          this.loadingContratos = false;
        }
      });
  }

  cambiarPaginaContratos(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginasContratos) return;
    this.cargarContratosActivos(pagina);
  }

  // ================================
  // 2) VER TODAS LAS DEVOLUCIONES DE UN CONTRATO
  // GET /devoluciones/contrato/:id_contrato
  // ================================
  verDetalleDevoluciones(contratoId: number): void {
    this.devolucionesService.findByContrato(contratoId).subscribe({
      next: (data: Devolucion[]) => {
        this.detalleDevolucionesContrato = data;
        this.mostrarModalDetalle = true;
        console.log('Detalle devoluciones:', data);
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  // ================================
  // 3) FILTRAR DEVOLUCIONES GENERALES
  // GET /devoluciones
  // ================================
  // Función para filtrar y paginar devoluciones

  // Cuando cargues los datos desde el backend
  cargarDevoluciones(pagina: number = 1): void {
    this.loadingDevoluciones = true;
    this.filtros.page = pagina;
    this.paginaActualDevoluciones = pagina;

    this.devolucionesService.findAll(this.filtros)
      .subscribe((res: PaginationResponse<Devolucion>) => {
        this.devoluciones = res.data;
        this.devolucionesFiltradas = [...this.devoluciones];

        console.log('Devoluciones recibidas:', this.devoluciones);

        this.totalPaginasDevoluciones = res.meta.totalPages;
        this.paginaActualDevoluciones = res.meta.page;
        this.limit = res.meta.limit;

        this.loadingDevoluciones = false;
      }, error => {
        console.error('Error al cargar devoluciones', error);
        this.loadingDevoluciones = false;
      });
  }

  cambiarPaginaDevoluciones(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginasDevoluciones) return;
    this.cargarDevoluciones(pagina);
  }

  // Función de filtro
  filtrarDevoluciones(searchTerm: string = ''): void {
    const term = searchTerm.toLowerCase();

    this.devolucionesFiltradas = this.devoluciones.filter((dev) => {
      const nombreHerramienta = dev.detalle?.herramienta?.nombre?.toLowerCase() || '';
      const razonSocial = dev.contrato?.cliente?.razon_social?.toLowerCase() || '';
      const contratoId = dev.contrato?.id_contrato?.toString() || '';

      // Filtrado por término + filtros de fecha y estado
      const filtroFecha = this.filtros.fecha_devolucion
        ? dev.fecha_devolucion.startsWith(this.filtros.fecha_devolucion)
        : true;

      const filtroEstado = this.filtros.estado ? dev.estado === this.filtros.estado : true;

      return (
        (nombreHerramienta.includes(term) || razonSocial.includes(term) || contratoId.includes(term)) &&
        filtroFecha &&
        filtroEstado
      );
    });
  }

  limpiarFiltros(): void {
    this.filtros = {
      page: 1,
      limit: this.limit,
      estado: undefined,
      id_contrato: undefined,
      fecha_devolucion: undefined,
    };
    this.filtrarDevoluciones(); // o recargar desde el backend si quieres
  }
  // ================================
  // 4) IR AL FORMULARIO CREAR DEVOLUCIÓN
  // ================================
  crearDevolucion(contrato: Contrato): void {
    this.router.navigate([`/devoluciones/crear/${contrato.id_contrato}`]);
  }

  // ================================
  // 5) ABRIR MODAL PARA EDITAR DEVOLUCIÓN
  // (solo cambia estado u observaciones)
  // ================================
  abrirModalEditar(devolucion: Devolucion): void {
    this.devolucionSeleccionada = { ...devolucion };
  }

  // ================================
  // 6) GUARDAR CAMBIOS DEL MODAL
  // PATCH /devoluciones/:id
  // ================================
  guardarEdicion(): void {
    if (!this.devolucionSeleccionada) return;

    const dto: UpdateDevolucionDto = {
      estado: this.devolucionSeleccionada.estado,
      observaciones: this.devolucionSeleccionada.observaciones,
    };

    this.devolucionesService.update(this.devolucionSeleccionada.id_devolucion, dto)
      .subscribe({
        next: (updatedDev: Devolucion) => {
          // Actualiza la lista local
          const index = this.devoluciones.findIndex(d => d.id_devolucion === updatedDev.id_devolucion);
          if (index !== -1) {
            this.devoluciones[index] = { ...this.devoluciones[index], ...updatedDev };
          }

          // Refrescar tabla filtrada
          this.filtrarDevoluciones('');

          // Cerrar modal
          this.devolucionSeleccionada = undefined;
        },
        error: (err) => console.error('Error al guardar cambios', err)
      });
  }
  // ================================
  // 7) CERRAR MODAL
  // ================================
  cerrarModal(): void {
    this.devolucionSeleccionada = undefined;
  }

  cerrarModalDetalle(): void {
    this.mostrarModalDetalle = false;
    this.detalleDevolucionesContrato = [];
  }

  verResumenDevolucion(id_contrato: number): void {
    this.devolucionesService.getResumenContrato(id_contrato).subscribe({
      next: (res) => {
        this.resumenContrato = res.resumen;
        this.herramientasResumen = res.herramientas;
        this.mostrarModalResumen = true;
        console.log('Resumen devoluciones:', res);
      },
      error: (err) => {
        console.error('Error al obtener resumen de devoluciones', err);
      }
    });
  }

  cerrarModalResumen(): void {
    this.mostrarModalResumen = false;
    this.resumenContrato = null;
    this.herramientasResumen = [];
  }

}
