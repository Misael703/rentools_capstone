import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuarioService } from '../usuario/usuario.service';

@Injectable()
export class AuthService {
  constructor(
    private usuarioService: UsuarioService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usuarioService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      sub: user.id_usuario,
      email: user.email,
      rol: user.rol.nombre,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id_usuario,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol.nombre,
      }
    };
  }
}