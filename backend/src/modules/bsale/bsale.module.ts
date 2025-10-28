import { Module } from '@nestjs/common';
import { BsaleService } from './bsale.service';
import { BsaleController } from './bsale.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [BsaleController],
  providers: [BsaleService],
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  exports: [BsaleService],
})
export class BsaleModule {}
