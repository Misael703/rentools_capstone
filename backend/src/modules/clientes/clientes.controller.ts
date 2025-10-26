import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto, UpdateClienteDto, SearchClienteDto } from './dto/index';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../rol/guards/roles.guard';
import { Roles } from '../rol/decorators/roles.decorator';

@Controller('clientes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @Roles('admin', 'vendedor')
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.create(createClienteDto);
  }

  @Get()  
  @Roles('admin', 'vendedor')
  findAll(@Query() filters: SearchClienteDto) {
    return this.clientesService.findAll(filters);
  }

  @Get('activos')
  @Roles('admin', 'vendedor')
  findAllActive() {
    return this.clientesService.findAllActive();
  }

  @Get('recientes')
  @Roles('admin', 'vendedor')
  findRecent(@Query('limit') limit?: number) {
    return this.clientesService.findRecent(limit);
  }

  @Get('stats')
  @Roles('admin')
  async getStats() {
    const total = await this.clientesService.count();
    const activos = await this.clientesService.countActive();
    const inactivos = total - activos;

    return {
      total,
      activos,
      inactivos,
      porcentajeActivos: total > 0 ? ((activos / total) * 100).toFixed(2) : 0,
    };
  }

  @Get('rut/:rut')
  @Roles('admin', 'vendedor')
  findByRut(@Param('rut') rut: string) {
    return this.clientesService.findByRut(rut);
  }

  @Get('email/:email')
  @Roles('admin', 'vendedor')
  findByEmail(@Param('email') email: string) {
    return this.clientesService.findByEmail(email);
  }

  @Get('existe/:rut')
  @Roles('admin', 'vendedor')
  async existsByRut(@Param('rut') rut: string) {
    const existe = await this.clientesService.existsByRut(rut);
    return {
      existe,
      rut,
      message: existe ? 'El cliente ya existe' : 'El cliente no existe',
    };
  }

  @Get(':id')
  @Roles('admin', 'vendedor')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.findById(id);
  }

  @Patch(':id')
  @Roles('admin', 'vendedor')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClienteDto: UpdateClienteDto,
  ) {
    return this.clientesService.update(id, updateClienteDto);
  }

  @Patch('activar/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async activate(@Param('id', ParseIntPipe) id: number) {
    const cliente = await this.clientesService.activate(id);
    return {
      message: 'Cliente activado correctamente',
      success: true,
      data: cliente,
    };
  }

  @Patch('desactivar/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    const cliente = await this.clientesService.softDelete(id);
    return {
      message: 'Cliente desactivado correctamente',
      success: true,
      data: cliente,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.clientesService.remove(id);
    return {
      message: 'Cliente eliminado correctamente',
      success: true,
    };
  }
}