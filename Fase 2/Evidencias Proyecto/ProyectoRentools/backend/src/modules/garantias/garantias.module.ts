import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GarantiasService } from './garantias.service';
import { GarantiasController } from './garantias.controller';
import { GarantiaPago } from './entities/garantia-pago.entity';
import { GarantiaDevolucion } from './entities/garantia-devolucion.entity';
import { Contrato } from '../contratos/entities/contrato.entity';
import { DetalleContrato } from '../contratos/entities/detalle-contrato.entity';
import { DevolucionHerramienta } from '../devoluciones/entities/devolucion-herramienta.entity';

@Module({
  controllers: [GarantiasController],
  providers: [GarantiasService],
  imports: [
    TypeOrmModule.forFeature([
      GarantiaPago,
      GarantiaDevolucion,
      Contrato,
      DetalleContrato,
      DevolucionHerramienta,
    ]),
  ],
  exports: [GarantiasService],
})
export class GarantiasModule {}
