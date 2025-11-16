import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from './Services/usuario';
import { Usuario } from './Interfaces/usuario.interface'; // Asegúrate de tener este archivo exportando Usuario
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
  loading: boolean = false;

  modalVisible: boolean = false;
  modalAccion: 'activar' | 'desactivar' | 'eliminar' | null = null;
  usuarioSeleccionado: Usuario | null = null;

  constructor(private usuarioService: UsuarioService, private router: Router) { }

  ngOnInit() {
    this.loadUsuarios();
  }

  loadUsuarios() {
    this.loading = true;
    this.usuarioService.getAll().subscribe({
      next: (lista) => {
        this.listaUsuarios = lista;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar usuarios', err);
        this.loading = false;
      }
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

  getRolNombre(usuario: Usuario) {
    return usuario.rol?.nombre || 'Desconocido';
  }

  // Navegación
  crearUsuario() {
    this.router.navigate(['/usuarios/crear']);
  }

  editarUsuario(usuario: Usuario) {
    this.router.navigate(['/usuarios/editar', usuario.id_usuario]);
  }


  abrirModal(accion: 'activar' | 'desactivar' | 'eliminar', usuario: Usuario) {
    this.modalAccion = accion;
    this.usuarioSeleccionado = usuario;
    this.modalVisible = true;
  }


  confirmarAccion() {
    if (!this.usuarioSeleccionado || !this.modalAccion) return;

    const id = this.usuarioSeleccionado.id_usuario;

    if (this.modalAccion === 'activar') {
      this.usuarioService.activate(id).subscribe({
        next: () => this.loadUsuarios(),
        error: (err) => console.error(err)
      });
    }

    if (this.modalAccion === 'desactivar') {
      this.usuarioService.deactivate(id).subscribe({
        next: () => this.loadUsuarios(),
        error: (err) => console.error(err)
      });
    }

    if (this.modalAccion === 'eliminar') {
      this.usuarioService.remove(id).subscribe({
        next: () => this.loadUsuarios(),
        error: (err) => console.error(err)
      });
    }

    this.cerrarModal();
  }

  cerrarModal() {
    this.modalVisible = false;
    this.modalAccion = null;
    this.usuarioSeleccionado = null;
  }
}