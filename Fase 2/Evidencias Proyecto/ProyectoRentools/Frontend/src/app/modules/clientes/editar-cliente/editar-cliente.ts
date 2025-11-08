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
  clienteForm!: FormGroup;
  clienteId!: number;
  cliente!: Cliente;
  tipos: string[] = ['persona_natural', 'empresa'];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private clientesService: ClientesService
  ) { }

  ngOnInit(): void {
    this.clienteId = +this.route.snapshot.paramMap.get('id')!;
    this.initForm();
    this.loadCliente();
  }

  /** Inicializa el formulario */
  private initForm() {
    this.clienteForm = this.fb.group({
      tipo_cliente: ['', Validators.required],
      rut: [{ value: '', disabled: true }, Validators.required],
      // Persona
      nombre: [''],
      apellido: [''],
      // Empresa
      razon_social: [''],
      nombre_fantasia: [''],
      giro: [''],
      // Comunes
      email: [''],
      telefono: [''],
      direccion: [''],
      ciudad: [''],
      comuna: ['']
    });
  }

  /** Carga el cliente existente desde backend */
  private loadCliente() {
    this.loading = true;
    this.clientesService.getById(this.clienteId).subscribe({
      next: (cliente) => {
        this.cliente = cliente;

        this.clienteForm.patchValue({
          tipo_cliente: cliente.tipo_cliente,
          rut: cliente.rut,
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

        this.applyTipoValidations(cliente.tipo_cliente);

        // Activar detección del cambio de tipo solo después de cargar datos
        this.onTipoChange();

        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  /** Detecta cambios en tipo_cliente */
  private onTipoChange() {
    this.clienteForm.get('tipo_cliente')?.valueChanges.subscribe(tipo => {
      this.applyTipoValidations(tipo);

      if (tipo === 'persona_natural') {
        // Si pasa a persona, limpia campos de empresa
        this.clienteForm.patchValue({
          razon_social: '',
          nombre_fantasia: '',
          giro: ''
        }, { emitEvent: false });

        // Limpia también los valores del backend temporalmente
        this.cliente.razon_social = '';
        this.cliente.nombre_fantasia = '';
        this.cliente.giro = '';

      } else if (tipo === 'empresa') {
        // Si pasa a empresa, limpia campos de persona
        this.clienteForm.patchValue({
          nombre: '',
          apellido: ''
        }, { emitEvent: false });

        // Limpia también en la variable cliente
        this.cliente.nombre = '';
        this.cliente.apellido = '';
      }
    });
  }

  /** Aplica validaciones dinámicas */
  private applyTipoValidations(tipo: string) {
    const controls = this.clienteForm.controls;

    // Limpiar validadores primero
    ['nombre', 'apellido', 'razon_social', 'nombre_fantasia', 'giro'].forEach(campo => {
      controls[campo].clearValidators();
      controls[campo].updateValueAndValidity();
    });

    if (tipo === 'persona_natural') {
      // Limpiar datos de empresa
      controls['razon_social'].reset('');
      controls['nombre_fantasia'].reset('');
      controls['giro'].reset('');

      // Requerir datos de persona
      controls['nombre'].setValidators([Validators.required]);
      controls['apellido'].setValidators([Validators.required]);
    } else if (tipo === 'empresa') {
      // Limpiar datos de persona
      controls['nombre'].reset('');
      controls['apellido'].reset('');

      // Requerir datos de empresa
      controls['razon_social'].setValidators([Validators.required]);
      controls['nombre_fantasia'].setValidators([Validators.required]);
      controls['giro'].setValidators([Validators.required]);
    }

    Object.values(controls).forEach(c => c.updateValueAndValidity());
  }

  /** Enviar actualización */
  actualizarCliente() {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const form = this.clienteForm.getRawValue();

    // Mezclamos el form con el cliente actual para que no se pierdan datos antiguos
    this.cliente = {
      ...this.cliente,
      ...form
    };

    //  Construimos el objeto de actualización limpio según tipo
    let datosActualizar: any = {
      tipo_cliente: form.tipo_cliente,
      email: form.email,
      telefono: form.telefono,
      direccion: form.direccion,
      ciudad: form.ciudad,
      comuna: form.comuna,
    };

    if (form.tipo_cliente === 'persona_natural') {
      datosActualizar = {
        ...datosActualizar,
        nombre: form.nombre,
        apellido: form.apellido,
        razon_social: '',
        nombre_fantasia: '',
        giro: '',
      };
    } else if (form.tipo_cliente === 'empresa') {
      datosActualizar = {
        ...datosActualizar,
        razon_social: form.razon_social,
        nombre_fantasia: form.nombre_fantasia,
        giro: form.giro,
        nombre: '',
        apellido: '',
      };
    }

    // Llamada principal al backend
    this.clientesService.update(this.clienteId, datosActualizar).subscribe({
      next: () => {
        // Refrescamos los datos del cliente local inmediatamente para que el cambio se vea reflejado
        this.clienteForm.patchValue({
          razon_social: form.razon_social,
          nombre_fantasia: form.nombre_fantasia,
          giro: form.giro,
          nombre: form.nombre,
          apellido: form.apellido,
        }, { emitEvent: false });

        // Reforzamos el guardado con un pequeño retraso opcional
        setTimeout(() => {
          this.clientesService.update(this.clienteId, datosActualizar).subscribe({
            next: () => {
              this.loading = false;
              alert('Cliente actualizado correctamente');
              this.router.navigate(['/clientes']);
            },
            error: (err) => {
              console.error('Error en segundo intento:', err.error);
              this.loading = false;
              alert('Error al confirmar la actualización');
            }
          });
        }, 300); // 300ms de retardo, puedes ajustar si quieres

      },
      error: (err) => {
        this.loading = false;
        console.error('Error:', err.error);
        alert('Error al actualizar cliente');
      }
    });
  }

  cancelar() {
    this.router.navigate(['/clientes']);
  }
}
