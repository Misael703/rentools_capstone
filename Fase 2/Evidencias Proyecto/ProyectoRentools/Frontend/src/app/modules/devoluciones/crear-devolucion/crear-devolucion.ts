import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';

import {
  EstadoDevolucion,
  HerramientaForm,
  CreateDevolucionDto,
  CreateDevolucionMasivaDto,
} from '../interfaces/devolucion.interfaces';

import { DevolucionesService } from '../services/devoluciones.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-crear-devolucion',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './crear-devolucion.html',
  styleUrl: './crear-devolucion.css',
})
export class CrearDevolucion implements OnInit {
  contratoId!: number;
  resumen: any = null;

  devolucionForm: FormGroup;

  loading = false;
  submitting = false;

  fechaHoy: string = new Date().toISOString().split('T')[0]; // yyyy-mm-dd

  mostrarMensaje = false;        // <-- Modal de éxito
  mensajeExito = '';             // <-- Texto dentro del modal

  mensajeError = '';             // <-- Mostrar errores en pantalla

  fechaDevolucion: string = new Date().toISOString().split('T')[0];

  estadosDevolucion = [
    { value: EstadoDevolucion.BUEN_ESTADO, label: 'Buen estado' },
    { value: EstadoDevolucion.REPARACION_MENOR, label: 'Reparación menor' },
    { value: EstadoDevolucion.DANADA, label: 'Dañada' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private devolucionesService: DevolucionesService
  ) {
    this.devolucionForm = this.fb.group({
      herramientas: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.contratoId = Number(params['id_contrato']);
      this.cargarResumen();
    });
  }

  // ================================================================
  // Cargar resumen del contrato
  // ================================================================
  cargarResumen(): void {
    this.loading = true;

    this.devolucionesService.getResumenContrato(this.contratoId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: resumen => {
          this.resumen = resumen;
          this.inicializarFormulario();
        },
        error: err => {
          this.mensajeError = err.error?.message || 'Error al cargar resumen';
        },
      });
  }

  // ================================================================
  // Crear formulario dinámico según herramientas pendientes
  // ================================================================
  inicializarFormulario(): void {
    const pendientes = this.resumen.herramientas.filter(
      (h: any) => h.cantidad_pendiente > 0
    );

    const formArray = pendientes.map((h: any) =>
      this.fb.group({
        id_detalle: [h.id_detalle],
        seleccionada: [false],
        cantidad_devuelta: [
          h.cantidad_pendiente,
          [Validators.required, Validators.min(1), Validators.max(h.cantidad_pendiente)],
        ],
        estado: [EstadoDevolucion.BUEN_ESTADO, Validators.required],
        observaciones: [''],
      })
    );

    this.devolucionForm.setControl('herramientas', this.fb.array(formArray));
  }

  get herramientasFA(): FormArray {
    return this.devolucionForm.get('herramientas') as FormArray;
  }

  getSliderBackground(value: number, max: number): string {
    const porcentaje = (value / max) * 100;
    return `linear-gradient(to right, #007bff 0%, #007bff ${porcentaje}%, #ddd ${porcentaje}%, #ddd 100%)`;
  }

  // Obtiene el FormArray de herramientas
  get herramientasFormArray(): FormArray {
    return this.devolucionForm.get('herramientas') as FormArray;
  }

  /**
   * Obtiene el FormGroup de una herramienta específica
   */
  getHerramientaFormGroup(index: number): FormGroup {
    return this.herramientasFormArray.at(index) as FormGroup;
  }


  // ================================================================
  // Seleccionar herramienta
  // ================================================================
  toggleSeleccion(i: number): void {
    const control = this.herramientasFA.at(i).get('seleccionada');
    control?.setValue(!control.value);
  }

  get haySeleccionadas(): boolean {
    return this.herramientasFA.value.some((h: any) => h.seleccionada);
  }

  get totalADecolver(): number {
    return this.herramientasFA.value
      .filter((h: any) => h.seleccionada)
      .reduce((acc: number, h: any) => acc + h.cantidad_devuelta, 0);
  }

  // ================================================================
  // Guardar devoluciones
  // ================================================================
  registrarDevolucion(): void {
    this.mensajeError = '';

    if (!this.validarFecha()) return;
    if (!this.haySeleccionadas) {
      this.mensajeError = 'Debes seleccionar al menos una herramienta.';
      return;
    }
    if (this.devolucionForm.invalid) {
      this.mensajeError = 'Hay campos inválidos en el formulario.';
      return;
    }

    const excede = this.herramientasFA.value.some((h: any, i: number) =>
      h.cantidad_devuelta > this.resumen.herramientas[i].cantidad_pendiente
    );
    if (excede) {
      this.mensajeError = 'La cantidad a devolver no puede exceder lo pendiente.';
      return;
    }

    const fechaEnviar = `${this.fechaDevolucion}T03:00:00.000Z`;

    const devoluciones = this.herramientasFA.value
      .filter((h: any) => h.seleccionada)
      .map((h: any) => ({
        id_detalle: h.id_detalle,
        cantidad_devuelta: h.cantidad_devuelta,
        fecha_devolucion: fechaEnviar,
        estado: h.estado,
        observaciones: h.observaciones || undefined
      }));

    const dto: CreateDevolucionMasivaDto = { devoluciones };

    this.submitting = true;

    this.devolucionesService.createMasiva(dto)
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: res => {
          const totalDev = res.data?.devoluciones.length ?? 0;
          this.mensajeExito = `¡Devolución exitosa! Se registraron ${totalDev} devoluciones.`;
          this.mostrarMensaje = true;
        },
        error: err => {
          this.mensajeError = err.error?.message || 'Error al registrar devoluciones.';
        }
      });
  }
  validarFecha(): boolean {
    if (this.fechaDevolucion > this.fechaHoy) {
      this.mensajeError = 'No se puede seleccionar una fecha futura.';
      return false;
    }
    this.mensajeError = '';
    return true;
  }

  incrementarCantidad(i: number): void {
    const control = this.herramientasFA.at(i).get('cantidad_devuelta');
    const max = this.resumen.herramientas[i].cantidad_pendiente;
    if (control && control.value < max) {
      control.setValue(control.value + 1);
    }
  }

  decrementarCantidad(i: number): void {
    const control = this.herramientasFA.at(i).get('cantidad_devuelta');
    if (control && control.value > 1) {
      control.setValue(control.value - 1);
    }
  }

  get totalSeleccionado(): number {
    return this.herramientasFA.value.reduce((sum: number, h: any) =>
      sum + (h.seleccionada ? h.cantidad_devuelta : 0), 0);
  }

  get porcentajeProgreso(): number {
    if (!this.resumen) return 0;
    const total = this.resumen.resumen.total_herramientas;
    const devueltas = this.resumen.resumen.total_devueltas;
    return total ? (devueltas / total) * 100 : 0;
  }

  get cantidadSeleccionadas(): number {
    return (this.herramientasFA.value as HerramientaForm[])
      .filter(h => h.seleccionada).length;
  }


  // ================================================================
  // Modal de éxito
  // ================================================================
  cerrarMensaje(): void {
    this.mostrarMensaje = false;
    this.router.navigate(['/devoluciones']); // Aquí sí navegas
  }
  // ================================================================
  // Cancelar
  // ================================================================
  cancelar(): void {
    this.router.navigate(['/devoluciones']);
  }

}
