import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService, Usuario } from '../usuario';
import { take } from 'rxjs';
@Component({
  selector: 'app-crear-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-usuario.html',
  styleUrl: './crear-usuario.css',
})
export class CrearUsuario {
  form: any;
  loading = false;
  mostrarMensaje = false;
  mensajeError = '';

  roles = [
    { id_rol: 1, nombre: 'Admin' },
    { id_rol: 2, nombre: 'Bodeguero' },
    { id_rol: 3, nombre: 'Vendedor' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private usuarioService: UsuarioService
  ) {
    // Inicializamos el formulario aquí, ya que fb ya está disponible
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      id_rol: ['', Validators.required]
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.mensajeError = '';

    const nuevoUsuario: Partial<Usuario> & { password: string } = {
      nombre: this.form.get('nombre')!.value!,
      email: this.form.get('email')!.value!,
      password: this.form.get('password')!.value!,
      id_rol: Number(this.form.get('id_rol')!.value)
    };

    this.usuarioService.create(nuevoUsuario)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.loading = false;
          this.mostrarMensaje = true;
        },
        error: (err) => {
          this.loading = false;
          this.mensajeError = err.error?.message || 'Error al crear usuario';
        }
      });
  }

  cerrarMensaje() {
    this.mostrarMensaje = false;
    this.router.navigate(['/usuarios']);
  }

  cancelar() {
    this.router.navigate(['/usuarios']);
  }
}
