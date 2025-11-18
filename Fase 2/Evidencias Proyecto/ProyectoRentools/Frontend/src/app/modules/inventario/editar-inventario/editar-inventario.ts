import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Inventory, } from '../Services/inventory';
import { Herramienta, CreateHerramientaForm, UpdateHerramientaForm } from '../Interfaces/inventario.interface';
import { switchMap, take } from 'rxjs';
import { of } from 'rxjs';

@Component({
  selector: 'app-editar-inventario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-inventario.html',
  styleUrl: './editar-inventario.css',
})
export class EditarInventario {
  form!: FormGroup;
  loading = false;
  mostrarMensaje = false;

  herramientaId!: number; // ID necesario para actualizar

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private inventory: Inventory
  ) { }

  ngOnInit(): void {
    // Inicializar formulario
    this.form = this.fb.group({
      sku_bsale: [{ value: '', disabled: true }], // NO editable
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: [''],
      precio_diario: [0, [Validators.required, Validators.min(0)]],
      garantia: [0, [Validators.required, Validators.min(0)]],
      dias_minimo: [1, [Validators.required, Validators.min(1)]],
      stock: [0, [Validators.required, Validators.min(0)]],
    });

    // Leer ID desde params y cargar herramienta
    this.route.paramMap.pipe(
      take(1),
      switchMap(params => {
        const idParam = params.get('id');
        const id = idParam ? Number(idParam) : NaN;
        if (!id || Number.isNaN(id)) {
          // ID inválido → redirigir
          this.router.navigate(['/inventario']);
          return of(null);
        }
        this.herramientaId = id;
        return this.inventory.getById(id);
      })
    ).subscribe({
      next: (h: Herramienta | null) => {
        if (!h) {
          // si h es null o no existe
          this.router.navigate(['/inventario']);
          return;
        }

        // Patch del formulario (incluye campo disabled)
        this.form.patchValue({
          sku_bsale: h.sku_bsale,
          nombre: h.nombre,
          descripcion: h.descripcion ?? '',
          precio_diario: h.precio_diario ?? 0,
          garantia: h.garantia ?? 0,
          dias_minimo: h.dias_minimo ?? 1,
          stock: h.stock ?? 0,
        });
      },
      error: () => {
        alert('No se pudo cargar la herramienta');
        this.router.navigate(['/inventario']);
      }
    });
  }

  // ---------------------------
  // Helpers para validación
  // ---------------------------
  get f() {
    return this.form.controls;
  }

  campoInvalido(campo: string): boolean {
    const c = this.f[campo];
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  mensajeError(campo: string): string {
    const c = this.f[campo];
    if (!c || !c.errors) return '';

    const errors = c.errors;
    if (errors['required']) return 'Este campo es obligatorio';
    if (errors['min']) return `El mínimo permitido es ${errors['min'].min}`;
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres`;

    return 'Campo inválido';
  }

  // ---------------------------
  // Guardar cambios
  // ---------------------------
  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    // Construir payload solo con campos editables y no vacíos
    const payload: UpdateHerramientaForm = {};
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      // omitimos campos deshabilitados (ej. sku_bsale)
      if (!control || control.disabled) return;

      const val = control.value;
      if (val !== undefined && val !== null && val !== '') {
        // mapear nombre de control -> campo del DTO (ya coinciden)
        (payload as any)[key] = val;
      }
    });

    this.inventory.update(this.herramientaId, payload).pipe(take(1)).subscribe({
      next: () => {
        this.loading = false;
        this.mostrarMensaje = true;
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message || 'Error al actualizar la herramienta';
        alert(msg);
      }
    });
  }

  cerrarMensaje() {
    this.mostrarMensaje = false;
    this.router.navigate(['/inventario']);
  }

  onCancel() {
    this.router.navigate(['/inventario']);
  }

}
