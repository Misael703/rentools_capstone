import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { RolModule } from './modules/rol/rol.module';
import { SeedModule } from './seed/seed.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { HerramientasModule } from './modules/herramientas/herramientas.module';
import { BsaleModule } from './modules/bsale/bsale.module';
import { ContratosModule } from './modules/contratos/contratos.module';
import { ScheduleModule } from '@nestjs/schedule';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: true, // SACAR EN PRODUCCIÓN
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsuarioModule,
    RolModule,
    SeedModule,
    ClientesModule,
    HerramientasModule,
    BsaleModule,
    ContratosModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [],
})
export class AppModule {}
