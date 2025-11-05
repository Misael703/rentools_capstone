export interface User {
  id_usuario: number;
  nombre: string;
  email: string;
  id_rol: number;
  rol: {
    id_rol: number;
    nombre: string;
  };
  activo?: boolean;
  // no incluir password
}