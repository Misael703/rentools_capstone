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

  constructor(private usuarioService: UsuarioService, private router: Router) {}

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

  // Activar / Desactivar usuario
  toggleActivo(usuario: Usuario) {
    if (usuario.activo) {
      this.usuarioService.deactivate(usuario.id_usuario).subscribe({
        next: () => this.loadUsuarios(),
        error: (err) => console.error(err)
      });
    } else {
      this.usuarioService.activate(usuario.id_usuario).subscribe({
        next: () => this.loadUsuarios(),
        error: (err) => console.error(err)
      });
    }
  }

  eliminarUsuario(usuario: Usuario) {
    if (!confirm(`¿Seguro que deseas eliminar a ${usuario.nombre}?`)) return;
    this.usuarioService.remove(usuario.id_usuario).subscribe({
      next: () => this.loadUsuarios(),
      error: (err) => console.error(err)
    });
  }
}