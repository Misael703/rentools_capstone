import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BsaleService } from './bsale.service';
import { BsaleController } from './bsale.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { BsaleConfig } from './entities/bsale-config.entity';
import { BsaleProduct } from './entities/bsale-product.entity';
import { HerramientasModule } from '../herramientas/herramientas.module';

@Module({
  controllers: [BsaleController],
  providers: [BsaleService],
  imports: [
    TypeOrmModule.forFeature([BsaleConfig, BsaleProduct]),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
    forwardRef(() => HerramientasModule),
  ],
  exports: [BsaleService],
})
export class BsaleModule {}
