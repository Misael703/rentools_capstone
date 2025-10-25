import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async findByEmail(email: string): Promise<Usuario> {
    const user = await this.usuarioRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async create(usuario: Partial<Usuario>): Promise<Usuario> {
    const newUser = this.usuarioRepo.create(usuario);
    return this.usuarioRepo.save(newUser);
  }

  async findAll(): Promise<Usuario[]> {
    return this.usuarioRepo.find();
  }
}