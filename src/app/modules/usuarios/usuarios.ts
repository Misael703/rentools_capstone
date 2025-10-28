import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService, Usuario } from './usuario';
import { Router } from '@angular/router';
@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {

  listaUsuarios: Usuario[] = [];
  terminoBusqueda: string = '';

  mostrarConfirmacion = false;
  mensajeConfirmacion = '';
  usuarioSeleccionado: Usuario | null = null;
  accion: 'habilitar' | 'deshabilitar' | null = null;

  mostrarMensaje = false;
  mensajeResultado = '';
  iconoResultado = '';

  constructor(private usuarioService: UsuarioService, private router: Router) { }

  ngOnInit() {
    this.loadUsuarios();
  }

  loadUsuarios() {
    this.usuarioService.getAll().subscribe(lista => {
      this.listaUsuarios = lista;
    });
  }

  // Filtrado por búsqueda de nombre o email
  aplicarFiltro() {
    const termino = this.terminoBusqueda.toLowerCase();
    return this.listaUsuarios.filter(u =>
      u.nombre.toLowerCase().includes(termino) ||
      u.email.toLowerCase().includes(termino)
    );
  }

  getRolNombre(id_rol: number) {
    return this.usuarioService.getRolNombre(id_rol);
  }

  // Botones de acciones por ahora solo placeholders
  crearUsuario() {
    this.router.navigate(['/usuarios/crear']);
  }

  editarUsuario(usuario: Usuario) {
    this.router.navigate(['/usuarios/editar', usuario.id_usuario]);
  }

  // --- Confirmar acciones ---
  confirmarDeshabilitar(usuario: Usuario) {
    if (!usuario.activo) return;
    this.usuarioSeleccionado = usuario;
    this.accion = 'deshabilitar';
    this.mensajeConfirmacion = `¿Está seguro de deshabilitar al usuario "${usuario.nombre}"?`;
    this.mostrarConfirmacion = true;
  }

  confirmarHabilitar(usuario: Usuario) {
    if (usuario.activo) return;
    this.usuarioSeleccionado = usuario;
    this.accion = 'habilitar';
    this.mensajeConfirmacion = `¿Desea habilitar al usuario "${usuario.nombre}"?`;
    this.mostrarConfirmacion = true;
  }

  cancelarConfirmacion() {
    this.mostrarConfirmacion = false;
    this.usuarioSeleccionado = null;
  }

  aceptarConfirmacion() {
    if (!this.usuarioSeleccionado || !this.accion) return;

    const id = this.usuarioSeleccionado.id_usuario;
    this.usuarioService.toggleActivo(id).subscribe(() => {
      this.mostrarConfirmacion = false;
      this.loadUsuarios();

      if (this.accion === 'deshabilitar') {
        this.iconoResultado = 'bi bi-x-circle-fill text-danger';
        this.mensajeResultado = '¡Usuario deshabilitado!';
      } else {
        this.iconoResultado = 'bi bi-check-circle-fill text-success';
        this.mensajeResultado = '¡Usuario habilitado!';
      }

      this.mostrarMensaje = true;
      this.usuarioSeleccionado = null;
      this.accion = null;
    });
  }

  cerrarMensaje() {
    this.mostrarMensaje = false;
  }
}
