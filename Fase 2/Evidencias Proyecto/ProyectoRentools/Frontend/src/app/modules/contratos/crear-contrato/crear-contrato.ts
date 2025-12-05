import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ContratosService } from '../Services/contrato.service';
import { Inventory } from '../../inventario/Services/inventory';
import { ClientesService } from '../../clientes/Services/cliente.service';
import { UsuarioService } from '../../usuarios/Services/usuario';
import { CarritoService } from '../../inventario/Services/carrito.service';
import {
  CreateContratoDto,
  CreateDetalleContratoDto,
  DetalleContrato,
  Contrato
} from '../Interfaces/contrato.interfaces';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-crear-contrato',
  imports: [FormsModule, CommonModule],
  templateUrl: './crear-contrato.html',
  styleUrl: './crear-contrato.css',
})
export class CrearContrato implements OnInit {
  // -----------------------
  // Cliente
  // -----------------------
  clienteSeleccionado: any | null = null; // el Cliente viene del ClientesService
  busquedaCliente = '';
  sugerenciasClientes: any[] = [];
  // -----------------------
  // Fechas / datos contrato
  // -----------------------
  tipo_entrega: 'retiro' | 'despacho' = 'retiro';
  fecha_inicio: string = '';
  fecha_termino_estimada: string = '';
  observaciones: string = '';

  // -----------------------
  // Herramientas / detalle (carrito)
  // -----------------------
  herramientasDisponibles: any[] = []; // lista desde Inventory.findDisponibles()
  herramientaSeleccionadaId: number | null = null;
  cantidadSeleccionada: number = 1;
  diasSeleccionados: number = 1;

  // Cada item contiene: id_herramienta, cantidad, dias_arriendo, plus helpers para UI
  detalles: Array<CreateDetalleContratoDto & { herramienta?: any; subtotal?: number }> = [];

  // -----------------------
  // Visuales / estado
  // -----------------------
  cargando = false;
  mensajeError = '';
  mensajeExito = '';

  mostrarModalExito = false;



  // Usuario actual (solo para mostrar)
  usuarioActual: any | null = null;

  constructor(
    private carritoService: CarritoService,
    private contratosService: ContratosService,
    private inventory: Inventory,
    private clientesService: ClientesService,
    private usuarioService: UsuarioService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Cargar herramientas disponibles para selección inicial
    this.cargarHerramientasDisponibles();

    // Intentar leer usuario desde localStorage para mostrar (opcional)
    try {
      const u = localStorage.getItem('usuario');
      if (u) this.usuarioActual = JSON.parse(u);
    } catch (err) {
      this.usuarioActual = null;
    }

    // =============================
    // Cargar herramientas desde el CARRITO
    // =============================
    const itemsCarrito = this.carritoService.obtenerHerramientas();

    if (itemsCarrito.length > 0) {
      this.detalles = itemsCarrito.map(item => ({
        id_herramienta: item.id_herramienta,
        cantidad: item.cantidad,
        dias_arriendo: item.dias_arriendo,

        herramienta: item,
        subtotal: item.subtotal
      }));
    }
  }


  // -----------------------
  // Cargar herramientas disponibles (para el selector)
  // -----------------------
  cargarHerramientasDisponibles(page = 1, limit = 100): void {
    this.inventory.findDisponibles({ page, limit }).subscribe({
      next: (resp) => {
        this.herramientasDisponibles = resp.data || [];
      },
      error: (err: any) => {
        console.error('Error cargando herramientas:', err);
        this.herramientasDisponibles = [];
      }
    });
  }

  private convertirFechaAUTC(fecha: string): string {
    // fecha = "YYYY-MM-DD"
    const [year, month, day] = fecha.split('-').map(Number);
    // Crear la fecha en UTC a mediodía para evitar desfases por huso horario
    const fechaUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return fechaUTC.toISOString(); // formato ISO completo
  }
  // -----------------------
  // Buscar cliente (autocompletado)
  // -----------------------
  autocompleteClientes(): void {
    const q = this.busquedaCliente.trim();

    if (q.length < 2) {
      this.sugerenciasClientes = [];
      return;
    }

    this.clientesService.autocomplete(q).subscribe({
      next: (resp) => {
        this.sugerenciasClientes = resp || [];
      },
      error: () => {
        this.sugerenciasClientes = [];
      }
    });
  }

  seleccionarClienteAutocomplete(cliente: any): void {
    this.clienteSeleccionado = cliente;
    this.busquedaCliente = cliente.rut + ' - ' +
      (cliente.tipo_cliente === 'empresa'
        ? cliente.razon_social
        : cliente.nombre + ' ' + cliente.apellido);

    this.sugerenciasClientes = [];
  }


  // -----------------------
  // Agregar detalle al carrito
  // -----------------------
  agregarDetalle(): void {
    this.mensajeError = '';

    if (!this.herramientaSeleccionadaId) {
      this.mensajeError = 'Selecciona una herramienta.';
      return;
    }

    if (!Number.isFinite(this.cantidadSeleccionada) || this.cantidadSeleccionada < 1) {
      this.mensajeError = 'La cantidad debe ser al menos 1.';
      return;
    }

    if (!Number.isFinite(this.diasSeleccionados) || this.diasSeleccionados < 1) {
      this.mensajeError = 'Los días de arriendo deben ser al menos 1.';
      return;
    }

    // Obtener objeto herramienta seleccionado de la lista
    // Convertir el valor seleccionado a número
    const idSeleccionado = Number(this.herramientaSeleccionadaId);

    // Buscar la herramienta en la lista por id_herramienta
    const herramienta = this.herramientasDisponibles.find(h => h.id_herramienta === idSeleccionado);

    if (!herramienta) {
      this.mensajeError = 'Herramienta seleccionada no encontrada en la lista.';
      return;
    }

    // Validación días mínimos si está disponible en la herramienta (dias_minimo)
    if (herramienta.dias_minimo && this.diasSeleccionados < herramienta.dias_minimo) {
      this.mensajeError = `La herramienta ${herramienta.nombre} requiere al menos ${herramienta.dias_minimo} días.`;
      return;
    }

    // Verificar disponibilidad en backend por id y cantidad
    this.inventory.checkDisponibilidad(herramienta.id_herramienta || herramienta.id, this.cantidadSeleccionada)
      .subscribe({
        next: (resp: any) => {
          if (resp && resp.disponible === false) {
            // Si el endpoint retorna disponible=false o stock insuficiente
            this.mensajeError = resp.message || `Stock insuficiente para ${herramienta.nombre}.`;
            return;
          }

          // Calcular subtotal para vista previa (precio diario desde herramienta)
          // Intentamos leer precio desde campos comunes (precio_diario, precio_arriendo, precio)
          const precioDiario = herramienta.precio_diario ?? herramienta.precio_arriendo ?? herramienta.precio ?? 0;
          const subtotal = Math.round(this.cantidadSeleccionada * precioDiario * this.diasSeleccionados);

          // Agregar al arreglo de detalles (solo campos que backend espera + helpers)
          const detalle: CreateDetalleContratoDto & { herramienta?: any; subtotal?: number } = {
            id_herramienta: herramienta.id_herramienta ?? herramienta.id,
            cantidad: this.cantidadSeleccionada,
            dias_arriendo: this.diasSeleccionados,
            herramienta,
            subtotal
          };

          this.detalles.push(detalle);

          // reset inputs de selección
          this.herramientaSeleccionadaId = null;
          this.cantidadSeleccionada = 1;
          this.diasSeleccionados = 1;
        },
        error: (err: any) => {
          console.error('Error verificando disponibilidad:', err);
          this.mensajeError = err?.error?.message || 'No fue posible verificar disponibilidad.';
        }
      });
  }

  // -----------------------
  // Remover detalle por index
  // -----------------------
  removerDetalle(index: number): void {
    this.detalles.splice(index, 1);
  }

  // -----------------------
  // Cálculos para mostrar en UI (subtotal, estimado, garantia)
  // -----------------------
  calcularSubtotalVista(): number {
    return this.detalles.reduce((sum, d) => sum + (d.subtotal ?? 0), 0);
  }

  calcularGarantiaVista(): number {
    // Intentamos sumar garantía por herramienta si disponible (campo garantia)
    return this.detalles.reduce((sum, d) => {
      const g = d.herramienta?.garantia ?? d.herramienta?.deposito ?? 0;
      return sum + (g * (d.cantidad ?? 0));
    }, 0);
  }

  calcularTotalVista(): number {
    return this.calcularSubtotalVista() + this.calcularGarantiaVista();
  }

  // -----------------------
  // Validar fechas antes de enviar
  // -----------------------
  fechasValidas(): boolean {
    if (!this.fecha_inicio || !this.fecha_termino_estimada) {
      this.mensajeError = 'Debes indicar fecha de inicio y fecha de término estimada.';
      return false;
    }

    // Comparar directamente como strings en formato YYYY-MM-DD
    if (this.fecha_termino_estimada <= this.fecha_inicio) {
      this.mensajeError = 'La fecha de término debe ser posterior a la fecha de inicio.';
      return false;
    }

    return true;
  }

  // -----------------------
  // Enviar contrato al backend
  // -----------------------
  crearContrato(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    if (!this.clienteSeleccionado) {
      this.mensajeError = 'Debes seleccionar un cliente antes de crear el contrato.';
      return;
    }

    if (this.detalles.length === 0) {
      this.mensajeError = 'El contrato debe tener al menos un detalle (herramienta).';
      return;
    }

    if (!this.fecha_inicio || !this.fecha_termino_estimada) {
      this.mensajeError = 'Debes indicar fecha de inicio y fecha de término estimada.';
      return;
    }

    // ----------------------
    // Validar que la fecha de término sea posterior a la fecha de inicio
    // ----------------------
    if (this.fecha_termino_estimada <= this.fecha_inicio) {
      this.mensajeError = 'La fecha de término debe ser posterior a la fecha de inicio.';
      return;
    }

    // ----------------------
    // Helper para formatear fecha como YYYY-MM-DD
    // ----------------------
    const formatDateForAPI = (fecha: string) => {
      const [year, month, day] = fecha.split('-');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    // ----------------------
    // Preparar DTO para enviar al backend
    // ----------------------
    const dto: CreateContratoDto = {
      id_cliente: this.clienteSeleccionado.id_cliente ?? this.clienteSeleccionado.id,
      tipo_entrega: this.tipo_entrega as any,
      fecha_inicio: formatDateForAPI(this.fecha_inicio),
      fecha_termino_estimada: formatDateForAPI(this.fecha_termino_estimada),
      observaciones: this.observaciones?.trim() || undefined,
      detalles: this.detalles.map(d => ({
        id_herramienta: d.id_herramienta,
        cantidad: d.cantidad,
        dias_arriendo: d.dias_arriendo
      }))
    };

    this.cargando = true;
    this.contratosService.create(dto).subscribe({
      next: (resp: any) => {
        this.cargando = false;
        this.carritoService.limpiarCarrito();
        this.mostrarModalExito = true;
      },
      error: (err: any) => {
        this.cargando = false;
        console.error('Error creando contrato:', err);
        const backendMsg = err?.error?.message || (Array.isArray(err?.error?.message) ? err.error.message.join(', ') : null);
        this.mensajeError = backendMsg || 'Ocurrió un error al crear el contrato.';
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/contratos']);
  }

  aceptarExito(): void {
    this.mostrarModalExito = false;
    this.router.navigate(['/contratos']);  // Redirige al listado
  }
}
