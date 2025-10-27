import { Module } from '@nestjs/common';
import { HerramientasService } from './herramientas.service';
import { HerramientasController } from './herramientas.controller';

@Module({
  controllers: [HerramientasController],
  providers: [HerramientasService],
})
export class HerramientasModule {}
