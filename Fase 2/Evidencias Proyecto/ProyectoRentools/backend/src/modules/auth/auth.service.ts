import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../usuario/entities/usuario.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,

    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    // Buscar usuario con password y relación de rol
    const user = await this.usuarioRepository.findOne({
      where: { email },
      select: {
        id_usuario: true,
        email: true,
        password: true,
        nombre: true,
        id_rol: true,
      },
      relations: ['rol'],
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas (email)');
    }

    // Validar password
    if (!await bcrypt.compare(password, user.password)) {
      throw new UnauthorizedException('Credenciales inválidas (password)');
    }

    // Retornar token y datos del usuario (sin password)
    return {
      ...user,
      password: undefined, // Eliminar password del objeto
      token: this.getJwtToken({
        sub: user.id_usuario,
        email: user.email,
        rol: user.rol.nombre,
      }),
    };
  }

  private getJwtToken(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }
}