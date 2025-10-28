import { Module } from '@nestjs/common';
import { RolService } from './rol.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rol } from './entities/rol.entity';

@Module({
  providers: [RolService],
  imports: [TypeOrmModule.forFeature([Rol])],
  exports: [RolService],
})
export class RolModule {}
