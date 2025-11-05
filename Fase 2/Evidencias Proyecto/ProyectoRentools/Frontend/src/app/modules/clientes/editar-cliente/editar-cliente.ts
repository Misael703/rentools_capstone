import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientesService } from '../Services/cliente.service';
import { Cliente } from '../Interfaces/cliente.interfaces';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-editar-cliente',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-cliente.html',
  styleUrl: './editar-cliente.css',
})
export class EditarCliente implements OnInit {
  clienteForm: FormGroup;
  clienteId!: number;
  cliente!: Cliente;
  tipos: string[] = ['persona_natural', 'empresa'];
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private clientesService: ClientesService
  ) {
    this.clienteForm = this.fb.group({
      tipo_cliente: ['', Validators.required],
      rut: ['', Validators.required],
      nombre: [''],
      apellido: [''],
      razon_social: [''],
      nombre_fantasia: [''],
      giro: [''],
      email: [''],
      telefono: [''],
      direccion: [''],
      ciudad: [''],
      comuna: ['']
    });
  }

  ngOnInit(): void {
    this.clienteId = +this.route.snapshot.paramMap.get('id')!;
    this.loadCliente();
    this.onTipoChange();
  }

  // Carga el cliente desde el backend
  loadCliente() {
    this.loading = true;
    this.clientesService.getById(this.clienteId).subscribe({
      next: (cliente) => {
        this.cliente = cliente;

        // PatchValue explícito para todos los campos del formulario
        this.clienteForm.patchValue({
          tipo_cliente: cliente.tipo_cliente || '',
          rut: cliente.rut || '',
          nombre: cliente.nombre || '',
          apellido: cliente.apellido || '',
          razon_social: cliente.razon_social || '',
          nombre_fantasia: cliente.nombre_fantasia || '',
          giro: cliente.giro || '',
          email: cliente.email || '',
          telefono: cliente.telefono || '',
          direccion: cliente.direccion || '',
          ciudad: cliente.ciudad || '',
          comuna: cliente.comuna || ''
        });

        // Aplicar las validaciones después de cargar los valores
        this.applyTipoValidations(cliente.tipo_cliente);

        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }
  // Detecta cambios en tipo_cliente para actualizar validaciones
  onTipoChange() {
    this.clienteForm.get('tipo_cliente')?.valueChanges.subscribe(tipo => {
      this.applyTipoValidations(tipo);
    });
  }

  // Aplica validaciones dinámicamente según el tipo de cliente
  private applyTipoValidations(tipo: string) {
    if (tipo === 'persona_natural') {
      this.clienteForm.get('nombre')?.setValidators([Validators.required]);
      this.clienteForm.get('apellido')?.setValidators([Validators.required]);
      this.clienteForm.get('razon_social')?.clearValidators();
      this.clienteForm.get('giro')?.clearValidators();
    } else if (tipo === 'empresa') {
      this.clienteForm.get('razon_social')?.setValidators([Validators.required]);
      this.clienteForm.get('giro')?.setValidators([Validators.required]);
      this.clienteForm.get('nombre')?.clearValidators();
      this.clienteForm.get('apellido')?.clearValidators();
    }

    // Actualizar validaciones
    ['nombre', 'apellido', 'razon_social', 'giro'].forEach(campo =>
      this.clienteForm.get(campo)?.updateValueAndValidity()
    );
  }

  // Enviar formulario para actualizar cliente
  actualizarCliente() {
    if (this.clienteForm.invalid) return;

    this.loading = true;

    // Campos comunes que siempre se pueden actualizar
    const datosActualizar: any = {
      email: this.clienteForm.value.email,
      direccion: this.clienteForm.value.direccion,
      ciudad: this.clienteForm.value.ciudad,
      comuna: this.clienteForm.value.comuna
    };

    // Campos según el tipo de cliente
    if (this.cliente.tipo_cliente === 'persona_natural') {
      datosActualizar.nombre = this.clienteForm.value.nombre;
      datosActualizar.apellido = this.clienteForm.value.apellido;
    } else if (this.cliente.tipo_cliente === 'empresa') {
      datosActualizar.razon_social = this.clienteForm.value.razon_social;
      datosActualizar.nombre_fantasia = this.clienteForm.value.nombre_fantasia;
      datosActualizar.giro = this.clienteForm.value.giro;
    }

    // Llamada al servicio
    this.clientesService.update(this.clienteId, datosActualizar).subscribe({
      next: (res) => {
        this.loading = false;
        alert('Cliente actualizado correctamente');
        this.router.navigate(['/clientes']);
      },
      error: (err) => {
        this.loading = false;
        console.error('Cuerpo del error:', err.error);
        if (err.error?.message) {
          alert('Error al actualizar cliente:\n' + err.error.message.join('\n'));
        } else {
          alert('Error al actualizar cliente');
        }
      }
    });
  }

  cancelar(): void {
  this.router.navigate(['/clientes']);
}
}
