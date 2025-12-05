import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { Pago } from './entities/pago.entity';
import { Contrato } from '../contratos/entities/contrato.entity';
import { DevolucionHerramienta } from '../devoluciones/entities/devolucion-herramienta.entity';
import { DetalleContrato } from '../contratos/entities/detalle-contrato.entity';

@Module({
  controllers: [PagosController],
  providers: [PagosService],
  imports: [
    TypeOrmModule.forFeature([
      Pago,
      Contrato,
      DevolucionHerramienta,
      DetalleContrato,
    ]),
  ],
  exports: [PagosService],
})
export class PagosModule {}
