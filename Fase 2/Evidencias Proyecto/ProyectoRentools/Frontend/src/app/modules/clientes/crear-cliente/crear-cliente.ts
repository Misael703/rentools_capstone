// src/app/modules/clientes/crear-cliente/crear-cliente.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientesService } from '../Services/cliente.service';
import { Cliente } from '../Interfaces/cliente.interfaces';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
// Definir enum local para frontend
export enum TipoCliente {
  PERSONA_NATURAL = 'persona_natural',
  EMPRESA = 'empresa',
}

@Component({
  selector: 'app-crear-cliente',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-cliente.html',
  styleUrl: './crear-cliente.css',
})
export class CrearCliente implements OnInit {
  clienteForm!: FormGroup;
  tipos = Object.values(TipoCliente); // ['persona_natural', 'empresa']

  constructor(private fb: FormBuilder, private clienteService: ClientesService, private router: Router) { }

  ngOnInit(): void {
    // Inicializar formulario con todos los campos
    this.clienteForm = this.fb.group({
      tipo_cliente: ['', Validators.required],
      rut: ['', [Validators.required, Validators.pattern(/^\d{7,8}-[\dkK]$/)]],
      // Campos persona natural
      nombre: [''],
      apellido: [''],
      // Campos empresa
      razon_social: [''],
      nombre_fantasia: [''],
      giro: [''],
      // Campos comunes
      email: [''],
      telefono: [''],
      direccion: [''],
      ciudad: [''],
      comuna: [''],
      id_bsale: [''],
    });

    // Escuchar cambios en tipo_cliente para mostrar/ocultar campos
    this.clienteForm.get('tipo_cliente')?.valueChanges.subscribe(tipo => {
      this.actualizarValidaciones(tipo);
    });
  }

  private actualizarValidaciones(tipo: TipoCliente) {
    if (tipo === TipoCliente.PERSONA_NATURAL) {
      this.clienteForm.get('nombre')?.setValidators([Validators.required]);
      this.clienteForm.get('apellido')?.setValidators([Validators.required]);
      this.clienteForm.get('razon_social')?.clearValidators();
      this.clienteForm.get('giro')?.clearValidators();
    } else if (tipo === TipoCliente.EMPRESA) {
      this.clienteForm.get('razon_social')?.setValidators([Validators.required]);
      this.clienteForm.get('giro')?.setValidators([Validators.required]);
      this.clienteForm.get('nombre')?.clearValidators();
      this.clienteForm.get('apellido')?.clearValidators();
    }

    // Actualizar validaciones
    this.clienteForm.get('nombre')?.updateValueAndValidity();
    this.clienteForm.get('apellido')?.updateValueAndValidity();
    this.clienteForm.get('razon_social')?.updateValueAndValidity();
    this.clienteForm.get('giro')?.updateValueAndValidity();
  }

  crearCliente() {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      console.warn('Formulario inválido, revisar los campos.');
      return;
    }

    const form = this.clienteForm.value;

    let nuevoCliente: any = {
      rut: form.rut,
      tipo_cliente: form.tipo_cliente,
      email: form.email || undefined,
      telefono: form.telefono || undefined,
      direccion: form.direccion || undefined,
      ciudad: form.ciudad || undefined,
      comuna: form.comuna || undefined,
    };

    if (form.tipo_cliente === 'persona_natural') {
      nuevoCliente = {
        ...nuevoCliente,
        nombre: form.nombre,
        apellido: form.apellido,
      };
    } else if (form.tipo_cliente === 'empresa') {
      nuevoCliente = {
        ...nuevoCliente,
        razon_social: form.razon_social,
        nombre_fantasia: form.nombre_fantasia || undefined,
        giro: form.giro,
      };
    }

    console.log('Datos a enviar al backend:', nuevoCliente);

    this.clienteService.create(nuevoCliente).subscribe({
      next: cliente => {
        console.log('Cliente creado exitosamente:', cliente);
        this.router.navigate(['/clientes']);
      },
      error: err => {
        console.error('Error creando cliente:', err);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/clientes']);
  }
}
