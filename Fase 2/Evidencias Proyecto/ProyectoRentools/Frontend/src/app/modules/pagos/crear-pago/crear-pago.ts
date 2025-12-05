import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PagosService } from '../services/pago.services';
import {
  MetodoPago,
  CreatePago,
  ResumenPagosContrato,
} from '../interfaces/pago.interfaces';
@Component({
  selector: 'app-crear-pago',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './crear-pago.html',
  styleUrl: './crear-pago.css',
})
export class CrearPago implements OnInit {
  contratoId!: number;
  resumen!: ResumenPagosContrato;

  pagoForm!: FormGroup;

  loading = false;
  submitting = false;

  mensajeError = '';
  mostrarMensaje = false;
  mensajeExito = '';

  // Métodos de pago
  metodos = [
    { value: MetodoPago.EFECTIVO, label: 'Efectivo' },
    { value: MetodoPago.TARJETA_DEBITO, label: 'Tarjeta Débito' },
    { value: MetodoPago.TARJETA_CREDITO, label: 'Tarjeta Crédito' },
    { value: MetodoPago.TRANSFERENCIA, label: 'Transferencia' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private pagosService: PagosService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.contratoId = Number(params['id_contrato']);
      this.cargarResumen();
    });
  }

  // ===============================================================
  // Cargar el resumen de pagos del contrato
  // ===============================================================
  cargarResumen(): void {
    this.loading = true;
    console.log('➡️ Cargando resumen para contrato:', this.contratoId);

    this.pagosService.getResumenContrato(this.contratoId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: any) => {
          console.log('📥 Respuesta raw del backend:', res);

          // Mapear correctamente el resumen según la estructura del backend
          if (res && res.resumen) {
            this.resumen = res.resumen as ResumenPagosContrato;
          } else if (res && res.monto_total_a_pagar !== undefined) {
            this.resumen = res as ResumenPagosContrato;
          } else {
            console.warn('⚠️ Formato inesperado del backend para /resumen:', res);
            this.resumen = res as ResumenPagosContrato;
          }

          // 🔹 CORREGIR fecha_termino_real si existe
          if (this.resumen.contrato?.fecha_termino_real) {
            const fechaTermino = new Date(this.resumen.contrato.fecha_termino_real);
            this.resumen.contrato.fecha_termino_real = fechaTermino.toISOString().split('T')[0];
          } else if (this.resumen.contrato) {
            // fallback: si no hay fecha, asignar hoy
            this.resumen.contrato.fecha_termino_real = new Date().toISOString().split('T')[0];
          }

          console.log('📌 Resumen final asignado (fecha corregida):', this.resumen);

          this.inicializarFormulario();
        },
        error: (err) => {
          console.error('❌ Error cargando resumen:', err);
          this.mensajeError = err.error?.message || 'Error al cargar el resumen del contrato.';
        },
      });
  }

  // ===============================================================
  // Inicializar formulario
  // ===============================================================
  inicializarFormulario(): void {
    console.log('🧾 Inicializando formulario con resumen:', this.resumen);

    const saldo = this.resumen?.saldo_pendiente ?? 0;

    this.pagoForm = this.fb.group({
      monto: [saldo, [Validators.required, Validators.min(1)]],
      metodo_pago: [MetodoPago.EFECTIVO, Validators.required],
      referencia: [''],
    });

    console.log('📄 Formulario creado:', this.pagoForm.value);
  }

  get pendiente(): number {
    return this.resumen?.saldo_pendiente ?? 0;
  }

  // ===============================================================
  // Validaciones adicionales
  // ===============================================================
  validarMontos(): boolean {
    const monto = this.pagoForm.get('monto')?.value ?? 0;
    console.log('💰 Validando montos -> monto:', monto, 'pendiente:', this.pendiente);

    if (monto <= 0) {
      this.mensajeError = 'El monto debe ser mayor que 0.';
      return false;
    }

    if (monto > this.pendiente) {
      this.mensajeError = 'El monto no puede ser mayor al saldo pendiente del contrato.';
      return false;
    }

    this.mensajeError = '';
    return true;
  }

  // ===============================================================
  // Registrar pago
  // ===============================================================
  registrarPago(): void {
    if (this.pagoForm.invalid || !this.validarMontos()) return;

    // -----------------------------
    // Obtener fecha local en formato YYYY-MM-DD
    // -----------------------------
    const formatDateForAPI = (fecha: Date) => {
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const fechaPago = formatDateForAPI(new Date());

    const dto: CreatePago = {
      id_contrato: this.contratoId,
      fecha_pago: fechaPago,  // ✅ Solo YYYY-MM-DD
      monto: this.pagoForm.value.monto,
      metodo_pago: this.pagoForm.value.metodo_pago,
      referencia: this.pagoForm.value.referencia || undefined,
    };

    this.submitting = true;

    this.pagosService
      .create(dto)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.mensajeExito = 'Pago registrado exitosamente.';
          this.mostrarMensaje = true;
        },
        error: (err) => {
          this.mensajeError = err.error?.message || 'Error al registrar el pago.';
        },
      });
  }
  cerrarMensaje(): void {
    this.mostrarMensaje = false;
    this.router.navigate(['/pagos']);
  }

  cancelar(): void {
    this.router.navigate([`/devoluciones/crear/${this.contratoId}`]);
  }
}
