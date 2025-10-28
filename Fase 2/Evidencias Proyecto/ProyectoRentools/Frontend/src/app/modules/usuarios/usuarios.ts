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

  desactivarUsuario(usuario: Usuario) {
    // lógica de desactivar, por ahora solo alerta
    this.usuarioService.toggleActivo(usuario.id_usuario).subscribe(() => {
      // recargar lista después de desactivar
      this.loadUsuarios();
    });
  }
}
