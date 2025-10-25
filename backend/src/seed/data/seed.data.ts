import * as bcrypt from 'bcrypt';

interface SeedUser {
  nombre: string;
  email: string;
  password: string;
  rol: string;
}

interface SeedData {
  users: SeedUser[];
}

export const initialData: SeedData = {
  users: [
    {
      nombre: 'Admin',
      email: 'admin@rentools.cl',
      password: bcrypt.hashSync('admin123', 10),
      rol: 'admin',
    },
    {
      nombre: 'Vendedor 1',
      email: 'vendedor@rentools.cl',
      password: bcrypt.hashSync('vendedor123', 10),
      rol: 'vendedor',
    },
    {
      nombre: 'Bodeguero 1',
      email: 'bodega@rentools.cl',
      password: bcrypt.hashSync('bodega123', 10),
      rol: 'bodeguero',
    },
  ],
};