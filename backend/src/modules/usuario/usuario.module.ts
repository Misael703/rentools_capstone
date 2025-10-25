import { Module } from '@nestjs/common';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';

@Module({
  controllers: [UsuarioController],
  providers: [UsuarioService],
  imports: [TypeOrmModule.forFeature([Usuario])],
  exports: [UsuarioService],
})
export class UsuarioModule {}
