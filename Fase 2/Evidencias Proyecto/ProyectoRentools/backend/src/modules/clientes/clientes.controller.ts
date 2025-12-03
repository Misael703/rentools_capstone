// src/modules/clientes/clientes.controller.ts
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
import { CreateClienteDto, UpdateClienteDto, SearchClienteDto, AutocompleteClienteDto } from './dto/index';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../rol/guards/roles.guard';
import { Roles } from '../rol/decorators/roles.decorator';

@Controller('clientes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  /**
   * POST /clientes
   * Crea un cliente (busca en Bsale primero, crea si no existe)
   */
  @Post()
  @Roles('admin', 'vendedor')
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.create(createClienteDto);
  }

  /**
   * GET /clientes
   * Lista todos los clientes con paginación y filtros
   */
  @Get()
  @Roles('admin', 'vendedor')
  findAll(@Query() filters: SearchClienteDto) {
    return this.clientesService.findAll(filters);
  }

  /**
   * GET /clientes/activos
   * Lista solo clientes activos (sin paginación)
   */
  @Get('activos')
  @Roles('admin', 'vendedor')
  findAllActive() {
    return this.clientesService.findAllActive();
  }

  /**
   * GET /clientes/recientes
   * Lista los últimos clientes creados
   */
  @Get('recientes')
  @Roles('admin', 'vendedor')
  findRecent(@Query('limit') limit?: number) {
    return this.clientesService.findRecent(limit);
  }

  /**
   * GET /clientes/stats
   * Estadísticas de clientes
   */
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

  /**
   * GET /clientes/search
   * Búsqueda optimizada para autocompletado
   * Busca en: nombre, apellido, nombre completo, razón social y RUT
   * Se activa después de 3 caracteres
   * Retorna máximo 10 resultados formateados para dropdown
   *
   * Query params:
   * - query: término de búsqueda (mínimo 3 caracteres)
   * - limit: cantidad de resultados (máximo 20, default 10)
   *
   * Ejemplos:
   * - GET /clientes/search?query=juan
   * - GET /clientes/search?query=12345678
   * - GET /clientes/search?query=empresa&limit=5
   */
  @Get('search')
  @Roles('admin', 'vendedor')
  async autocomplete(@Query() filters: AutocompleteClienteDto) {
    return this.clientesService.autocomplete(filters);
  }

  /**
   * POST /clientes/sync-from-bsale
   * Sincroniza manualmente todos los clientes desde Bsale
   */
  @Post('sync-from-bsale')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async syncFromBsale() {
    const result = await this.clientesService.syncAllFromBsale();
    
    return {
      message: 'Sincronización completada',
      success: true,
      data: {
        total: result.nuevos + result.sincronizados,
        nuevos: result.nuevos,
        sincronizados: result.sincronizados,
        errores: result.errores,
      },
      detalles: result.detalles,
    };
  }

  /**
   * GET /clientes/buscar-bsale/:rut
   * Busca un cliente en Bsale y lo sincroniza si no existe localmente
   */
  @Get('buscar-bsale/:rut')
  @Roles('admin', 'vendedor')
  async findOrSyncFromBsale(@Param('rut') rut: string) {
    const cliente = await this.clientesService.findOrSyncFromBsale(rut);
    return {
      message: 'Cliente encontrado o sincronizado desde Bsale',
      data: cliente,
    };
  }

  /**
   * GET /clientes/rut/:rut
   * Busca un cliente por RUT (solo local)
   */
  @Get('rut/:rut')
  @Roles('admin', 'vendedor')
  findByRut(@Param('rut') rut: string) {
    return this.clientesService.findByRut(rut);
  }

  /**
   * GET /clientes/email/:email
   * Busca un cliente por email
   */
  @Get('email/:email')
  @Roles('admin', 'vendedor')
  findByEmail(@Param('email') email: string) {
    return this.clientesService.findByEmail(email);
  }

  /**
   * GET /clientes/existe/:rut
   * Verifica si existe un cliente con ese RUT
   */
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

  /**
   * GET /clientes/:id
   * Obtiene un cliente por ID
   */
  @Get(':id')
  @Roles('admin', 'vendedor')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.findById(id);
  }

  /**
   * PATCH /clientes/:id
   * Actualiza un cliente (actualiza en Rentools y Bsale)
   */
  @Patch(':id')
  @Roles('admin', 'vendedor')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClienteDto: UpdateClienteDto,
  ) {
    return this.clientesService.update(id, updateClienteDto);
  }

  /**
   * PATCH /clientes/activar/:id
   * Activa un cliente desactivado (marca activo = true)
   */
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

  /**
   * DELETE /clientes/:id
   * Desactiva un cliente (soft delete - marca activo = false)
   * No elimina el registro de la base de datos
   */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    const cliente = await this.clientesService.remove(id);
    return {
      message: 'Cliente desactivado correctamente',
      success: true,
      data: cliente,
    };
  }
}