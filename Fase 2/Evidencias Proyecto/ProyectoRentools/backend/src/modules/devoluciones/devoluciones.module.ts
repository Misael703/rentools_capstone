import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevolucionesService } from './devoluciones.service';
import { DevolucionesController } from './devoluciones.controller';
import { DevolucionHerramienta } from './entities/devolucion-herramienta.entity';
import { Contrato } from '../contratos/entities/contrato.entity';
import { DetalleContrato } from '../contratos/entities/detalle-contrato.entity';

@Module({
  controllers: [DevolucionesController],
  providers: [DevolucionesService],
  imports: [
    TypeOrmModule.forFeature([
      DevolucionHerramienta,
      Contrato,
      DetalleContrato,
    ]),
  ],
  exports: [DevolucionesService],
})
export class DevolucionesModule {}
