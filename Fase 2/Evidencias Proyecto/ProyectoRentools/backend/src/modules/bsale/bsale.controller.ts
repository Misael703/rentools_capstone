import { Controller, Get, UseGuards } from '@nestjs/common';
import { BsaleService } from './bsale.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../rol/guards/roles.guard';
import { Roles } from '../rol/decorators/roles.decorator';

@Controller('bsale')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BsaleController {
  constructor(private readonly bsaleService: BsaleService) {}

  @Get('test-connection')
  @Roles('admin')
  async testConnection() {
    const isConnected = await this.bsaleService.testConnection();
    return {
      success: isConnected,
      message: isConnected 
        ? 'Conexión con Bsale exitosa' 
        : 'Error al conectar con Bsale',
    };
  }

  @Get('clientes-count')
  @Roles('admin')
  async getClientesCount() {
    const clientes = await this.bsaleService.getAllClientes();
    return {
      total: clientes.length,
      message: `Se encontraron ${clientes.length} clientes en Bsale`,
    };
  }
}