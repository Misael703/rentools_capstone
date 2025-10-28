import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { initialData } from './data/seed.data';
import { Usuario } from 'src/modules/usuario/entities/usuario.entity';
import { Rol } from 'src/modules/rol/entities/rol.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,

    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,
  ) {}

  async runSeed() {
    await this.deleteTables();
    await this.insertRoles();
    await this.insertUsers();
    return { message: 'Seed ejecutada correctamente' };
  }

private async deleteTables() {
  // Eliminar dependientes primero
  await this.usuarioRepo.createQueryBuilder()
    .delete()
    .execute();

  await this.rolRepo.createQueryBuilder()
    .delete()
    .execute();
  }

  private async insertRoles() {
    const roles = ['admin', 'vendedor', 'bodeguero'];
    for (const nombre of roles) {
      const rol = this.rolRepo.create({ nombre });
      await this.rolRepo.save(rol);
    }
  }

  private async insertUsers() {
    const users = initialData.users;
    for (const user of users) {
      const rol = await this.rolRepo.findOneBy({ nombre: user.rol });
      if (!rol) {
        throw new Error(`Rol ${user.rol} no encontrado`);
      }

      const nuevoUsuario = this.usuarioRepo.create({
        nombre: user.nombre,
        email: user.email,
        password: user.password,
        rol,
      });
      await this.usuarioRepo.save(nuevoUsuario);
    }
  }
}