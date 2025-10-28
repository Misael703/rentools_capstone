import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioService, Usuario } from '../usuario';
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
    this.form = this.fb.group({
      id_usuario: [{ value: '', disabled: true }, Validators.required],
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
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
      this.form.patchValue(u);
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;

    const usuarioActualizado: Usuario = {
      id_usuario: this.id_usuario,
      nombre: this.form.get('nombre')!.value,
      email: this.form.get('email')!.value,
      password: this.form.get('password')!.value,
      id_rol: Number(this.form.get('id_rol')!.value),
      activo: true // se mantiene activo, solo se puede desactivar desde la lista
    };

    this.usuarioService.update(usuarioActualizado).pipe(take(1)).subscribe(() => {
      this.loading = false;
      this.mostrarMensaje = true;
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
