import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContratosService } from './contratos.service';
import { ContratosController } from './contratos.controller';
import { Contrato } from './entities/contrato.entity';
import { DetalleContrato } from './entities/detalle-contrato.entity';
import { HerramientasModule } from '../herramientas/herramientas.module';
import { ClientesModule } from '../clientes/clientes.module';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  controllers: [ContratosController],
  providers: [ContratosService],
  imports: [
    TypeOrmModule.forFeature([Contrato, DetalleContrato]),
    HerramientasModule,
    ClientesModule,
    UsuarioModule,
  ],
  exports: [ContratosService],
})
export class ContratosModule {}
