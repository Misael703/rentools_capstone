import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioService, Usuario } from '../Services/usuario';
import { switchMap, take } from 'rxjs';

@Component({
  selector: 'app-editar-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-usuario.html',
  styleUrl: './editar-usuario.css',
})
export class EditarUsuario {
  form: any;
  loading = false;
  id_usuario = 0;
  mostrarMensaje = false;

  roles = [
    { id_rol: 1, nombre: 'Admin' },
    { id_rol: 2, nombre: 'Bodeguero' },
    { id_rol: 3, nombre: 'Vendedor' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private usuarioService: UsuarioService
  ) {
    // Inicializar el formulario dentro del constructor
    this.form = this.fb.group({
      id_usuario: [{ value: '', disabled: true }, Validators.required],
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.minLength(6)],
      id_rol: ['', Validators.required]
    });

    // Cargar usuario según id de la ruta
    this.route.paramMap.pipe(
      take(1),
      switchMap(params => {
        const id = Number(params.get('id_usuario'));
        this.id_usuario = id;
        return this.usuarioService.getById(id);
      })
    ).subscribe(u => {
      if (!u) {
        alert('Usuario no encontrado');
        this.router.navigate(['/usuarios']);
        return;
      }
      // Parchar valores, convertir números a string para el formulario
      this.form.patchValue({
        id_usuario: String(u.id_usuario),
        nombre: u.nombre,
        email: u.email,
        id_rol: String(u.id_rol)
      });
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    // Crear objeto compatible con UpdateUsuarioDto
    const usuarioActualizado: Partial<Usuario> & { password?: string } = {
      nombre: this.form.get('nombre')?.value || undefined,
      email: this.form.get('email')?.value || undefined,
      id_rol: Number(this.form.get('id_rol')?.value),
    };

    const passwordValue = this.form.get('password')?.value;
    if (passwordValue) {
      usuarioActualizado.password = passwordValue;
    }

    this.usuarioService.update(this.id_usuario, usuarioActualizado).pipe(take(1))
      .subscribe({
        next: () => {
          this.loading = false;
          this.mostrarMensaje = true;
        },
        error: (err) => {
          this.loading = false;
          alert('Error al actualizar usuario: ' + err.message);
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
