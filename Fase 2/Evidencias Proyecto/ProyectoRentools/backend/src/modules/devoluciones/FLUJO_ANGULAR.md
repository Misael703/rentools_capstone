# Flujo Angular - Módulo de Devoluciones

Guía completa para implementar la pantalla de devoluciones en Angular.

## 🎯 Arquitectura Angular

```
src/app/
├── modules/
│   └── devoluciones/
│       ├── devoluciones.module.ts
│       ├── devoluciones-routing.module.ts
│       ├── components/
│       │   ├── devolucion-form/
│       │   │   ├── devolucion-form.component.ts
│       │   │   ├── devolucion-form.component.html
│       │   │   └── devolucion-form.component.scss
│       │   └── resumen-contrato/
│       │       ├── resumen-contrato.component.ts
│       │       ├── resumen-contrato.component.html
│       │       └── resumen-contrato.component.scss
│       ├── services/
│       │   └── devoluciones.service.ts
│       └── interfaces/
│           └── devolucion.interface.ts
└── core/
    └── services/
        └── http-client.service.ts
```

## 📦 1. Interfaces TypeScript

**`interfaces/devolucion.interface.ts`**

```typescript
export interface Herramienta {
  id_detalle: number;
  nombre_herramienta: string;
  cantidad_contratada: number;
  cantidad_devuelta: number;
  cantidad_pendiente: number;
  estado_devolucion: string;
  monto_cobrado?: number;
}

export interface HerramientaFormulario extends Herramienta {
  seleccionada: boolean;
  cantidad_a_devolver: number;
  estado: EstadoDevolucion;
  observaciones: string;
}

export enum EstadoDevolucion {
  BUEN_ESTADO = 'buen_estado',
  DANADA = 'danada',
  REPARACION_MENOR = 'reparacion_menor'
}

export interface ResumenContrato {
  contrato: {
    id_contrato: number;
    estado: string;
    monto_estimado: number;
    monto_cobrado_hasta_ahora: number;
  };
  herramientas: Herramienta[];
  resumen: {
    total_herramientas: number;
    total_devueltas: number;
    total_pendientes: number;
    porcentaje_devuelto: number;
  };
}

export interface CreateDevolucionDto {
  id_detalle: number;
  cantidad_devuelta: number;
  fecha_devolucion: string;
  estado: EstadoDevolucion;
  observaciones?: string;
}

export interface CreateDevolucionMasivaDto {
  devoluciones: CreateDevolucionDto[];
}

export interface DevolucionResponse {
  id_devolucion: number;
  id_detalle: number;
  cantidad_devuelta: number;
  fecha_devolucion: string;
  dias_reales: number;
  monto_cobrado: number;
  estado: EstadoDevolucion;
  observaciones?: string;
  detalle: {
    nombre_herramienta: string;
    contrato: {
      id_contrato: number;
      estado: string;
    };
  };
}

export interface DevolucionMasivaResponse {
  devoluciones: DevolucionResponse[];
  resumen: {
    total_devoluciones: number;
    total_herramientas_devueltas: number;
    monto_total_cobrado: number;
    contratos_finalizados: number[];
  };
}
```

## 🔧 2. Servicio de Devoluciones

**`services/devoluciones.service.ts`**

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ResumenContrato,
  CreateDevolucionMasivaDto,
  DevolucionMasivaResponse,
  DevolucionResponse
} from '../interfaces/devolucion.interface';

@Injectable({
  providedIn: 'root'
})
export class DevolucionesService {
  private readonly apiUrl = `${environment.apiUrl}/devoluciones`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el resumen de devoluciones de un contrato
   */
  getResumenContrato(idContrato: number): Observable<ResumenContrato> {
    return this.http.get<ResumenContrato>(
      `${this.apiUrl}/contrato/${idContrato}/resumen`
    );
  }

  /**
   * Registra múltiples devoluciones en una sola transacción
   */
  createDevolucionMasiva(
    dto: CreateDevolucionMasivaDto
  ): Observable<DevolucionMasivaResponse> {
    return this.http.post<DevolucionMasivaResponse>(
      `${this.apiUrl}/masiva`,
      dto
    );
  }

  /**
   * Obtiene todas las devoluciones de un contrato
   */
  getDevolucionesByContrato(idContrato: number): Observable<DevolucionResponse[]> {
    return this.http.get<DevolucionResponse[]>(
      `${this.apiUrl}/contrato/${idContrato}`
    );
  }

  /**
   * Lista todas las devoluciones con filtros
   */
  getAllDevoluciones(params?: {
    page?: number;
    limit?: number;
    id_contrato?: number;
    estado?: string;
    fecha_devolucion?: string;
  }): Observable<{
    data: DevolucionResponse[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http.get<any>(this.apiUrl, { params: httpParams });
  }

  /**
   * Obtiene una devolución por ID
   */
  getDevolucionById(id: number): Observable<DevolucionResponse> {
    return this.http.get<DevolucionResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Actualiza una devolución (solo estado y observaciones)
   */
  updateDevolucion(
    id: number,
    dto: { estado?: string; observaciones?: string }
  ): Observable<DevolucionResponse> {
    return this.http.patch<DevolucionResponse>(`${this.apiUrl}/${id}`, dto);
  }
}
```

## 🎨 3. Componente Principal

**`devolucion-form.component.ts`**

```typescript
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DevolucionesService } from '../../services/devoluciones.service';
import {
  ResumenContrato,
  HerramientaFormulario,
  EstadoDevolucion,
  CreateDevolucionMasivaDto
} from '../../interfaces/devolucion.interface';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-devolucion-form',
  templateUrl: './devolucion-form.component.html',
  styleUrls: ['./devolucion-form.component.scss']
})
export class DevolucionFormComponent implements OnInit {
  contratoId: number;
  resumen: ResumenContrato | null = null;
  herramientas: HerramientaFormulario[] = [];
  loading = false;
  submitting = false;

  devolucionForm: FormGroup;
  fechaDevolucion: string;

  // Enum para el template
  estadosDevolucion = [
    { value: EstadoDevolucion.BUEN_ESTADO, label: 'Buen estado' },
    { value: EstadoDevolucion.REPARACION_MENOR, label: 'Reparación menor' },
    { value: EstadoDevolucion.DANADA, label: 'Dañada' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private devolucionesService: DevolucionesService
  ) {
    // Fecha actual por defecto
    this.fechaDevolucion = new Date().toISOString().split('T')[0];

    this.devolucionForm = this.fb.group({
      herramientas: this.fb.array([])
    });
  }

  ngOnInit(): void {
    // Obtener ID del contrato de la ruta
    this.route.params.subscribe(params => {
      this.contratoId = +params['id'];
      this.cargarResumen();
    });
  }

  /**
   * Carga el resumen del contrato
   */
  cargarResumen(): void {
    this.loading = true;

    this.devolucionesService.getResumenContrato(this.contratoId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (resumen) => {
          this.resumen = resumen;
          this.inicializarHerramientas();
        },
        error: (error) => {
          console.error('Error al cargar resumen:', error);
          alert('Error al cargar el resumen del contrato');
        }
      });
  }

  /**
   * Inicializa el array de herramientas con las pendientes
   */
  inicializarHerramientas(): void {
    if (!this.resumen) return;

    // Filtrar solo herramientas con cantidad pendiente > 0
    const herramientasPendientes = this.resumen.herramientas
      .filter(h => h.cantidad_pendiente > 0);

    this.herramientas = herramientasPendientes.map(h => ({
      ...h,
      seleccionada: false,
      cantidad_a_devolver: h.cantidad_pendiente,
      estado: EstadoDevolucion.BUEN_ESTADO,
      observaciones: ''
    }));

    // Crear controles del formulario
    const herramientasFormArray = this.fb.array(
      this.herramientas.map(h => this.crearHerramientaFormGroup(h))
    );

    this.devolucionForm.setControl('herramientas', herramientasFormArray);
  }

  /**
   * Crea un FormGroup para una herramienta
   */
  crearHerramientaFormGroup(herramienta: HerramientaFormulario): FormGroup {
    return this.fb.group({
      id_detalle: [herramienta.id_detalle],
      seleccionada: [false],
      cantidad_a_devolver: [
        herramienta.cantidad_pendiente,
        [Validators.required, Validators.min(1), Validators.max(herramienta.cantidad_pendiente)]
      ],
      estado: [EstadoDevolucion.BUEN_ESTADO, Validators.required],
      observaciones: ['']
    });
  }

  /**
   * Obtiene el FormArray de herramientas
   */
  get herramientasFormArray(): FormArray {
    return this.devolucionForm.get('herramientas') as FormArray;
  }

  /**
   * Obtiene el FormGroup de una herramienta específica
   */
  getHerramientaFormGroup(index: number): FormGroup {
    return this.herramientasFormArray.at(index) as FormGroup;
  }

  /**
   * Toggle selección de herramienta
   */
  toggleHerramienta(index: number): void {
    const formGroup = this.getHerramientaFormGroup(index);
    const seleccionada = formGroup.get('seleccionada')?.value;
    formGroup.patchValue({ seleccionada: !seleccionada });
  }

  /**
   * Verifica si al menos una herramienta está seleccionada
   */
  get hayHerramientasSeleccionadas(): boolean {
    return this.herramientasFormArray.controls.some(
      control => control.get('seleccionada')?.value
    );
  }

  /**
   * Cuenta las herramientas seleccionadas
   */
  get cantidadSeleccionadas(): number {
    return this.herramientasFormArray.controls.filter(
      control => control.get('seleccionada')?.value
    ).length;
  }

  /**
   * Calcula el total de herramientas a devolver
   */
  get totalHerramientasADevolver(): number {
    return this.herramientasFormArray.controls
      .filter(control => control.get('seleccionada')?.value)
      .reduce((sum, control) => {
        return sum + (control.get('cantidad_a_devolver')?.value || 0);
      }, 0);
  }

  /**
   * Registra la devolución masiva
   */
  registrarDevolucion(): void {
    if (!this.hayHerramientasSeleccionadas) {
      alert('Debes seleccionar al menos una herramienta');
      return;
    }

    // Validar formulario
    if (this.devolucionForm.invalid) {
      alert('Por favor, revisa los datos ingresados');
      return;
    }

    // Confirmar acción
    const confirmacion = confirm(
      `¿Confirmas la devolución de ${this.totalHerramientasADevolver} herramientas?`
    );

    if (!confirmacion) return;

    this.submitting = true;

    // Preparar el DTO
    const devolucionesSeleccionadas = this.herramientasFormArray.controls
      .filter(control => control.get('seleccionada')?.value)
      .map(control => ({
        id_detalle: control.get('id_detalle')?.value,
        cantidad_devuelta: control.get('cantidad_a_devolver')?.value,
        fecha_devolucion: this.fechaDevolucion,
        estado: control.get('estado')?.value,
        observaciones: control.get('observaciones')?.value || undefined
      }));

    const dto: CreateDevolucionMasivaDto = {
      devoluciones: devolucionesSeleccionadas
    };

    // Enviar request
    this.devolucionesService.createDevolucionMasiva(dto)
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: (resultado) => {
          this.mostrarResultado(resultado);
        },
        error: (error) => {
          console.error('Error al registrar devolución:', error);
          this.mostrarError(error);
        }
      });
  }

  /**
   * Muestra el resultado de la devolución
   */
  mostrarResultado(resultado: any): void {
    const { resumen } = resultado;

    if (resumen.contratos_finalizados.length > 0) {
      // Contrato finalizado
      alert(
        `¡Contrato finalizado! 🎉\n\n` +
        `✅ Se devolvieron ${resumen.total_herramientas_devueltas} herramientas\n` +
        `💰 Monto total cobrado: $${resumen.monto_total_cobrado.toLocaleString('es-CL')}\n\n` +
        `El contrato #${this.contratoId} ha sido completado.`
      );

      // Redirigir a la lista de contratos o detalles
      this.router.navigate(['/contratos', this.contratoId]);
    } else {
      // Devolución parcial exitosa
      alert(
        `¡Devolución registrada! ✅\n\n` +
        `✅ Se devolvieron ${resumen.total_herramientas_devueltas} herramientas\n` +
        `💰 Monto cobrado: $${resumen.monto_total_cobrado.toLocaleString('es-CL')}\n\n` +
        `El contrato aún tiene herramientas pendientes de devolución.`
      );

      // Recargar resumen
      this.cargarResumen();
    }
  }

  /**
   * Muestra mensaje de error
   */
  mostrarError(error: any): void {
    let mensaje = 'Error al registrar la devolución';

    if (error.error?.message) {
      mensaje = error.error.message;
    }

    alert(mensaje);
  }

  /**
   * Cancela y vuelve atrás
   */
  cancelar(): void {
    if (this.hayHerramientasSeleccionadas) {
      const confirmacion = confirm('¿Deseas cancelar? Los cambios se perderán.');
      if (!confirmacion) return;
    }

    this.router.navigate(['/contratos', this.contratoId]);
  }

  /**
   * Calcula el porcentaje de progreso
   */
  get porcentajeProgreso(): number {
    return this.resumen?.resumen.porcentaje_devuelto || 0;
  }
}
```

## 🎨 4. Template HTML

**`devolucion-form.component.html`**

```html
<div class="devolucion-container" *ngIf="!loading; else loadingTemplate">
  <!-- Header -->
  <div class="page-header">
    <h1>📦 Devolución de Herramientas</h1>
    <p class="subtitle">Contrato #{{ contratoId }}</p>
  </div>

  <!-- Resumen del Contrato -->
  <div class="resumen-contrato card" *ngIf="resumen">
    <div class="card-header">
      <h2>Resumen del Contrato</h2>
    </div>
    <div class="card-body">
      <div class="info-grid">
        <div class="info-item">
          <span class="label">Estado:</span>
          <span class="value" [class.estado-activo]="resumen.contrato.estado === 'activo'">
            {{ resumen.contrato.estado | titlecase }}
          </span>
        </div>
        <div class="info-item">
          <span class="label">Monto Estimado:</span>
          <span class="value">${{ resumen.contrato.monto_estimado | number:'1.0-0' }}</span>
        </div>
        <div class="info-item">
          <span class="label">Monto Cobrado:</span>
          <span class="value">${{ resumen.contrato.monto_cobrado_hasta_ahora | number:'1.0-0' }}</span>
        </div>
      </div>

      <!-- Barra de Progreso -->
      <div class="progress-section">
        <div class="progress-info">
          <span>Progreso de Devolución</span>
          <span class="percentage">{{ porcentajeProgreso | number:'1.1-1' }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="porcentajeProgreso"></div>
        </div>
        <div class="progress-details">
          <span>{{ resumen.resumen.total_devueltas }} de {{ resumen.resumen.total_herramientas }} herramientas devueltas</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Formulario de Devoluciones -->
  <form [formGroup]="devolucionForm" (ngSubmit)="registrarDevolucion()">
    <!-- Fecha de Devolución -->
    <div class="fecha-section card">
      <div class="form-group">
        <label for="fechaDevolucion">Fecha de Devolución:</label>
        <input
          type="date"
          id="fechaDevolucion"
          class="form-control"
          [(ngModel)]="fechaDevolucion"
          [ngModelOptions]="{ standalone: true }"
          required
        />
      </div>
    </div>

    <!-- Lista de Herramientas -->
    <div class="herramientas-section">
      <h2>Herramientas Pendientes de Devolución</h2>

      <div *ngIf="herramientas.length === 0" class="empty-state">
        <p>✅ Todas las herramientas han sido devueltas</p>
      </div>

      <div formArrayName="herramientas" class="herramientas-list">
        <div
          *ngFor="let herramienta of herramientas; let i = index"
          class="herramienta-card card"
          [class.selected]="getHerramientaFormGroup(i).get('seleccionada')?.value"
          [formGroupName]="i"
        >
          <!-- Header de la Herramienta -->
          <div class="herramienta-header">
            <label class="checkbox-label">
              <input
                type="checkbox"
                formControlName="seleccionada"
                (change)="toggleHerramienta(i)"
              />
              <span class="herramienta-nombre">{{ herramienta.nombre_herramienta }}</span>
            </label>
          </div>

          <!-- Info de la Herramienta -->
          <div class="herramienta-info">
            <span class="info-badge">
              <strong>Contratadas:</strong> {{ herramienta.cantidad_contratada }}
            </span>
            <span class="info-badge">
              <strong>Devueltas:</strong> {{ herramienta.cantidad_devuelta }}
            </span>
            <span class="info-badge pendiente">
              <strong>Pendientes:</strong> {{ herramienta.cantidad_pendiente }}
            </span>
          </div>

          <!-- Formulario de Devolución (solo si está seleccionada) -->
          <div
            class="herramienta-form"
            *ngIf="getHerramientaFormGroup(i).get('seleccionada')?.value"
          >
            <!-- Cantidad a Devolver -->
            <div class="form-group">
              <label>Cantidad a devolver:</label>
              <div class="cantidad-control">
                <input
                  type="range"
                  formControlName="cantidad_a_devolver"
                  min="1"
                  [max]="herramienta.cantidad_pendiente"
                  class="slider"
                />
                <span class="cantidad-value">
                  {{ getHerramientaFormGroup(i).get('cantidad_a_devolver')?.value }}
                </span>
              </div>
            </div>

            <!-- Estado -->
            <div class="form-group">
              <label>Estado de la herramienta:</label>
              <select formControlName="estado" class="form-control">
                <option *ngFor="let estado of estadosDevolucion" [value]="estado.value">
                  {{ estado.label }}
                </option>
              </select>
            </div>

            <!-- Observaciones -->
            <div class="form-group">
              <label>Observaciones (opcional):</label>
              <textarea
                formControlName="observaciones"
                class="form-control"
                rows="3"
                placeholder="Detalles adicionales sobre la devolución..."
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Resumen de Selección -->
    <div class="selection-summary card" *ngIf="hayHerramientasSeleccionadas">
      <h3>Resumen de Devolución</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="label">Herramientas seleccionadas:</span>
          <span class="value">{{ cantidadSeleccionadas }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Total unidades a devolver:</span>
          <span class="value">{{ totalHerramientasADevolver }}</span>
        </div>
      </div>
    </div>

    <!-- Botones de Acción -->
    <div class="action-buttons">
      <button
        type="button"
        class="btn btn-secondary"
        (click)="cancelar()"
        [disabled]="submitting"
      >
        Cancelar
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        [disabled]="!hayHerramientasSeleccionadas || submitting"
      >
        <span *ngIf="!submitting">Registrar Devolución</span>
        <span *ngIf="submitting">Procesando...</span>
      </button>
    </div>
  </form>
</div>

<!-- Loading Template -->
<ng-template #loadingTemplate>
  <div class="loading-container">
    <div class="spinner"></div>
    <p>Cargando información del contrato...</p>
  </div>
</ng-template>
```

## 🎨 5. Estilos SCSS

**`devolucion-form.component.scss`**

```scss
.devolucion-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;

  h1 {
    font-size: 2rem;
    margin-bottom: 5px;
    color: #333;
  }

  .subtitle {
    color: #666;
    font-size: 1.1rem;
  }
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;

  .card-header {
    background: #f8f9fa;
    padding: 15px 20px;
    border-bottom: 1px solid #dee2e6;

    h2 {
      margin: 0;
      font-size: 1.25rem;
      color: #333;
    }
  }

  .card-body {
    padding: 20px;
  }
}

.resumen-contrato {
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 5px;

    .label {
      font-size: 0.875rem;
      color: #666;
    }

    .value {
      font-size: 1.25rem;
      font-weight: 600;
      color: #333;

      &.estado-activo {
        color: #28a745;
      }
    }
  }

  .progress-section {
    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;

      .percentage {
        font-weight: 600;
        color: #007bff;
      }
    }

    .progress-bar {
      height: 30px;
      background: #e9ecef;
      border-radius: 15px;
      overflow: hidden;
      margin-bottom: 5px;

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #007bff, #0056b3);
        transition: width 0.3s ease;
      }
    }

    .progress-details {
      font-size: 0.875rem;
      color: #666;
      text-align: center;
    }
  }
}

.fecha-section {
  padding: 20px;

  .form-group {
    display: flex;
    align-items: center;
    gap: 15px;

    label {
      font-weight: 500;
      margin: 0;
    }

    input[type="date"] {
      flex: 0 0 200px;
    }
  }
}

.herramientas-section {
  h2 {
    font-size: 1.5rem;
    margin-bottom: 20px;
    color: #333;
  }

  .empty-state {
    text-align: center;
    padding: 40px;
    color: #28a745;
    font-size: 1.1rem;
  }
}

.herramientas-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.herramienta-card {
  transition: all 0.3s ease;

  &.selected {
    border: 2px solid #007bff;
    box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
  }

  .herramienta-header {
    padding: 15px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #dee2e6;

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      margin: 0;

      input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }

      .herramienta-nombre {
        font-size: 1.1rem;
        font-weight: 600;
        color: #333;
      }
    }
  }

  .herramienta-info {
    padding: 15px 20px;
    display: flex;
    gap: 15px;
    flex-wrap: wrap;

    .info-badge {
      padding: 5px 12px;
      background: #e9ecef;
      border-radius: 20px;
      font-size: 0.875rem;

      &.pendiente {
        background: #fff3cd;
        color: #856404;
      }
    }
  }

  .herramienta-form {
    padding: 20px;
    background: #f8f9fa;
    border-top: 1px solid #dee2e6;

    .form-group {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #333;
      }

      .cantidad-control {
        display: flex;
        align-items: center;
        gap: 15px;

        .slider {
          flex: 1;
          height: 8px;
          -webkit-appearance: none;
          appearance: none;
          background: #ddd;
          border-radius: 5px;
          outline: none;

          &::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: #007bff;
            border-radius: 50%;
            cursor: pointer;
          }

          &::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: #007bff;
            border-radius: 50%;
            cursor: pointer;
            border: none;
          }
        }

        .cantidad-value {
          font-size: 1.25rem;
          font-weight: 600;
          color: #007bff;
          min-width: 30px;
          text-align: center;
        }
      }
    }
  }
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
}

select.form-control {
  cursor: pointer;
}

textarea.form-control {
  resize: vertical;
  min-height: 80px;
}

.selection-summary {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  h3 {
    margin-top: 0;
    margin-bottom: 15px;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .label {
      font-weight: 400;
    }

    .value {
      font-size: 1.5rem;
      font-weight: 700;
    }
  }
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #dee2e6;
}

.btn {
  padding: 12px 30px;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.btn-secondary {
    background: #6c757d;
    color: white;

    &:hover:not(:disabled) {
      background: #5a6268;
    }
  }

  &.btn-primary {
    background: #007bff;
    color: white;

    &:hover:not(:disabled) {
      background: #0056b3;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
    }
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  p {
    margin-top: 20px;
    color: #666;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// Responsive
@media (max-width: 768px) {
  .devolucion-container {
    padding: 10px;
  }

  .info-grid,
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;

    .btn {
      width: 100%;
    }
  }
}
```

## 📝 6. Módulo y Routing

**`devoluciones.module.ts`**

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DevolucionesRoutingModule } from './devoluciones-routing.module';
import { DevolucionFormComponent } from './components/devolucion-form/devolucion-form.component';
import { ResumenContratoComponent } from './components/resumen-contrato/resumen-contrato.component';

@NgModule({
  declarations: [
    DevolucionFormComponent,
    ResumenContratoComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DevolucionesRoutingModule
  ]
})
export class DevolucionesModule { }
```

**`devoluciones-routing.module.ts`**

```typescript
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DevolucionFormComponent } from './components/devolucion-form/devolucion-form.component';

const routes: Routes = [
  {
    path: 'contrato/:id',
    component: DevolucionFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DevolucionesRoutingModule { }
```

## 🔧 7. Configuración del Environment

**`environments/environment.ts`**

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

## 🚀 8. Uso en el App Routing

**`app-routing.module.ts`**

```typescript
const routes: Routes = [
  // ... otras rutas
  {
    path: 'devoluciones',
    loadChildren: () => import('./modules/devoluciones/devoluciones.module')
      .then(m => m.DevolucionesModule)
  }
];
```

## 📱 9. Navegación desde Contratos

Para navegar a la pantalla de devoluciones desde el módulo de contratos:

```typescript
// En el componente de detalle de contrato
navegarADevoluciones(idContrato: number): void {
  this.router.navigate(['/devoluciones/contrato', idContrato]);
}
```

```html
<!-- En el template de contrato -->
<button
  class="btn btn-primary"
  (click)="navegarADevoluciones(contrato.id_contrato)"
  *ngIf="contrato.estado === 'activo' || contrato.estado === 'vencido'"
>
  Registrar Devolución
</button>
```

## ✅ Checklist de Implementación

- [ ] Crear interfaces en `interfaces/devolucion.interface.ts`
- [ ] Crear servicio `services/devoluciones.service.ts`
- [ ] Crear componente `devolucion-form.component.ts`
- [ ] Crear template `devolucion-form.component.html`
- [ ] Crear estilos `devolucion-form.component.scss`
- [ ] Configurar módulo `devoluciones.module.ts`
- [ ] Configurar routing `devoluciones-routing.module.ts`
- [ ] Agregar ruta en `app-routing.module.ts`
- [ ] Configurar `environment.ts` con la URL del API
- [ ] Agregar botón de navegación desde contratos
- [ ] Probar flujo completo

¡Ahora tienes todo el código listo para Angular! 🚀
