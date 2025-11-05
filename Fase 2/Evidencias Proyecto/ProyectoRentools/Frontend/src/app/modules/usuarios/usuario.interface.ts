export interface Rol {
  id_rol: number;
  nombre: string;
}

export interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
  id_rol: number;
  rol: Rol;
  activo: boolean;
  created_at: string;
  updated_at: string;
}