import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Inventory } from '../Services/inventory';
import { Herramienta, CreateHerramientaForm, UpdateHerramientaForm } from '../Interfaces/inventario.interface';
import { take } from 'rxjs';


@Component({
  selector: 'app-crear-inventario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-inventario.html',
  styleUrl: './crear-inventario.css',
})
export class CrearInventario {

  form!: FormGroup;
  loading = false;
  serverError = '';

  mostrarMensaje = false;

  // Lista para el combo box
  listaProductosBsale: {
    id: number;
    product_id_bsale: number;
    product_name: string;
  }[] = [];

  constructor(
    private fb: FormBuilder,
    private herramientasService: Inventory,
    private router: Router
  ) { }

  ngOnInit(): void {

    // 1️⃣ Inicializar formulario
    this.form = this.fb.group({
      sku_bsale: ['', [Validators.required]],
      id_bsale: [null],
      product_id_bsale: ['', [Validators.required]],
      barcode: [''],
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      descripcion: [''],
      precio_diario: [null, [Validators.min(0)]],
      garantia: [null, [Validators.min(0)]],
      dias_minimo: [null, [Validators.min(1)]],
      stock: [null, [Validators.min(0)]],
    });

    // 2️⃣ Cargar productos desde Bsale
    this.cargarProductosBsale();
  }

  // ================================================================
  //  Método para cargar el combo box
  // ================================================================
  cargarProductosBsale() {
    this.herramientasService.getBsaleProductConfigs().subscribe({
      next: (data) => {
        this.listaProductosBsale = data;
      },
      error: (err) => {
        console.error('Error cargando productos Bsale', err);
      }
    });
  }

  // Getters para validación
  get f() { return this.form.controls; }

  campoInvalido(campo: string): boolean {
    return this.f[campo].invalid && (this.f[campo].dirty || this.f[campo].touched);
  }

  mensajeError(campo: string): string {
    const errors = this.f[campo].errors;
    if (!errors) return '';

    if (errors['required']) return 'Este campo es obligatorio';
    if (errors['min']) return `El mínimo permitido es ${errors['min'].min}`;
    if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;

    return 'Campo inválido';
  }

  // ================================================================
  // Enviar formulario
  // ================================================================
  onSubmit(): void {
    this.serverError = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const cleanedPayload = this.limpiarPayload(this.form.value);

    this.loading = true;

    this.herramientasService.create(cleanedPayload).subscribe({
      next: () => {
        this.loading = false;
        this.mostrarMensaje = true;
        this.form.reset();
      },
      error: (err) => {
        this.loading = false;
        this.serverError = err.error?.message || 'Error inesperado. Intenta nuevamente.';
      }
    });
  }

  private limpiarPayload(data: any) {
    const cleaned: any = {};
    Object.keys(data).forEach(key => {
      const value = data[key];

      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed !== '') cleaned[key] = trimmed;
      } else if (value !== null && value !== undefined) {
        cleaned[key] = value;
      }
    });

    return cleaned;
  }

  cerrarMensaje() {
    this.mostrarMensaje = false;
    this.router.navigate(['/inventario']);
  }

  cancelar() {
    this.router.navigate(['/inventario']);
  }

}
