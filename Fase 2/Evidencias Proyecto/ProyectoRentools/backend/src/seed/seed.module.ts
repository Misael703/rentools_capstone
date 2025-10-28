import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from 'src/modules/usuario/entities/usuario.entity';
import { Rol } from 'src/modules/rol/entities/rol.entity';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [TypeOrmModule.forFeature([Usuario, Rol])],
})
export class SeedModule {}
