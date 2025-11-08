import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Inventory, Herramienta } from '../Services/inventory';
import { switchMap, take } from 'rxjs';

@Component({
  selector: 'app-editar-inventario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-inventario.html',
  styleUrl: './editar-inventario.css',
})
export class EditarInventario {

  form: any;
  loading = false;
  codigo = '';
  mostrarMensaje = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private inventory: Inventory
  ) {

    // ✅ Inicializamos el formulario AQUÍ (después de que fb existe)
    this.form = this.fb.group({
      codigo: [{ value: '', disabled: true }, Validators.required], // código no editable
      nombre: ['', Validators.required],
      descripcion: [''],
      stock: [0, [Validators.required, Validators.min(0)]],
      precioDiario: [0, [Validators.required, Validators.min(0)]],
      precioGarantia: [0, [Validators.required, Validators.min(0)]],
    });

    // ✅ Cargar herramienta
    this.route.paramMap.pipe(
      take(1),
      switchMap(params => {
        const codigo = params.get('codigo') || '';
        this.codigo = codigo;
        return this.inventory.getByCodigo(codigo);
      })
    ).subscribe(h => {
      if (!h) {
        alert('Herramienta no encontrada');
        this.router.navigate(['/inventario']);
        return;
      }

      this.form.patchValue(h);
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;

    const updated: Herramienta = {
      codigo: this.codigo, // sigue siendo el mismo
      nombre: this.form.get('nombre')!.value || '',
      descripcion: this.form.get('descripcion')!.value || '',
      stock: Number(this.form.get('stock')!.value),
      precioDiario: Number(this.form.get('precioDiario')!.value),
      precioGarantia: Number(this.form.get('precioGarantia')!.value),
    };

    this.inventory.update(updated).pipe(take(1)).subscribe(() => {
      this.loading = false;
      this.mostrarMensaje = true;
    });
  }
  cerrarMensaje() {
    this.mostrarMensaje = false;
    this.router.navigate(['/inventario']); // ir al inventario
  }

  onCancel() {
    this.router.navigate(['/inventario']);
  }


}
