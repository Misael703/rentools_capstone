import { Module } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from './entities/cliente.entity';
import { BsaleModule } from '../bsale/bsale.module';

@Module({
  controllers: [ClientesController],
  providers: [ClientesService],
  imports : [TypeOrmModule.forFeature([Cliente]), BsaleModule],
  exports: [ClientesService],
})
export class ClientesModule {}
