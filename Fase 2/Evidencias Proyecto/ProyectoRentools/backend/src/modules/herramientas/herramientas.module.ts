import { Module, forwardRef } from '@nestjs/common';
import { HerramientasService } from './herramientas.service';
import { HerramientasController } from './herramientas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Herramienta } from './entities/herramienta.entity';
import { BsaleModule } from '../bsale/bsale.module';

@Module({
  controllers: [HerramientasController],
  providers: [HerramientasService],
  imports: [
    TypeOrmModule.forFeature([Herramienta]),
    forwardRef(() => BsaleModule)
  ],
  exports: [HerramientasService]
})
export class HerramientasModule {}
