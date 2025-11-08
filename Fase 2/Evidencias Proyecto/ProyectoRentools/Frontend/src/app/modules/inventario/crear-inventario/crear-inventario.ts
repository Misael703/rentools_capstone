import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms'; 
import { Router } from '@angular/router';
import { Inventory, Herramienta } from '../Services/inventory';
import { take } from 'rxjs';

@Component({
  selector: 'app-crear-inventario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-inventario.html',
  styleUrl: './crear-inventario.css',
})
export class CrearInventario {

  form: any; 
  loading = false; 
  mostrarMensaje = false;
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private inventory: Inventory,
  ) {
    //Inicializamos el formulario
    this.form = this.fb.group({
      codigo: ['', Validators.required],
      nombre: ['',Validators.required],
      descripcion: [''],
      stock: [0,[Validators.required, Validators.min(0)]],
      precioDiario: [0,[Validators.required, Validators.min(0)]],
      precioGarantia: [0,[Validators.required, Validators.min(0)]],
    });
  }

  //Guardar nueva Herramienta
  guardar() {
    if (this.form.invalid){
      this.form.markAllAsTouched();
      return; 
    }

    this.loading = true; 

    const nuevaHerramienta: Herramienta = {
      codigo: this.form.get('codigo')!.value,
      nombre: this.form.get('nombre')!.value,
      descripcion: this.form.get('descripcion')!.value || '',
      stock: Number(this.form.get('stock')!.value),
      precioDiario: Number(this.form.get('precioDiario')!.value),
      precioGarantia: Number(this.form.get('precioGarantia')!.value),
    };

    //Simulamos agregar la herramienta al servicio
    this.inventory.create(nuevaHerramienta).pipe(take(1)).subscribe(exito => {
      this.loading = false; 
      if (exito) {
        this.mostrarMensaje = true; 
      } else {
        alert('Ya existe una herramienta con ese código');
      }
    }); 

  }

  //Cerrar mensaje de confirmación y volver al inventario
  cerrarMensaje(){
    this.mostrarMensaje = false; 
    this.router.navigate(['/inventario']);
  }

  cancelar() {
    this.router.navigate(['/inventario']); 
  }

}
