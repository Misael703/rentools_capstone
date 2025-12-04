import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DevolucionesService } from './devoluciones.service';
import {
  CreateDevolucionDto,
  CreateDevolucionMasivaDto,
  UpdateDevolucionDto,
  SearchDevolucionDto,
} from './dto';
import { RolesGuard } from '../rol/guards/roles.guard';
import { Roles } from '../rol/decorators/roles.decorator';

@Controller('devoluciones')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DevolucionesController {
  constructor(private readonly devolucionesService: DevolucionesService) {}

  /**
   * POST /devoluciones
   * Registra una nueva devolución de herramientas
   * Calcula montos, devuelve stock y finaliza el contrato si corresponde
   */
  @Post()
  @Roles('admin', 'vendedor')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDevolucionDto: CreateDevolucionDto) {
    return this.devolucionesService.create(createDevolucionDto);
  }

  /**
   * POST /devoluciones/masiva
   * Registra múltiples devoluciones en una sola transacción
   * Perfecto para devolver varias herramientas desde el frontend
   */
  @Post('masiva')
  @Roles('admin', 'vendedor')
  @HttpCode(HttpStatus.CREATED)
  createMasiva(@Body() createDevolucionMasivaDto: CreateDevolucionMasivaDto) {
    return this.devolucionesService.createMasiva(createDevolucionMasivaDto);
  }

  /**
   * GET /devoluciones/contrato/:id_contrato/resumen
   * Obtiene un resumen completo del estado de devoluciones de un contrato
   * Incluye: total contratado, devuelto, pendiente, estado por herramienta
   */
  @Get('contrato/:id_contrato/resumen')
  @Roles('admin', 'vendedor')
  getResumenContrato(@Param('id_contrato', ParseIntPipe) id_contrato: number) {
    return this.devolucionesService.getResumenContrato(id_contrato);
  }

  /**
   * GET /devoluciones/contrato/:id_contrato
   * Obtiene todas las devoluciones de un contrato específico
   */
  @Get('contrato/:id_contrato')
  @Roles('admin', 'vendedor')
  findByContrato(@Param('id_contrato', ParseIntPipe) id_contrato: number) {
    return this.devolucionesService.findByContrato(id_contrato);
  }

  /**
   * GET /devoluciones
   * Lista todas las devoluciones con búsqueda y paginación
   * Filtros: id_contrato, estado, fecha_devolucion
   */
  @Get()
  @Roles('admin', 'vendedor')
  findAll(@Query() searchDto: SearchDevolucionDto) {
    return this.devolucionesService.findAll(searchDto);
  }

  /**
   * GET /devoluciones/:id
   * Obtiene una devolución específica con todas sus relaciones
   */
  @Get(':id')
  @Roles('admin', 'vendedor')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.devolucionesService.findOne(id);
  }

  /**
   * PATCH /devoluciones/:id
   * Actualiza una devolución (solo estado y observaciones)
   * NO permite cambiar cantidades ni fechas
   */
  @Patch(':id')
  @Roles('admin', 'vendedor')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDevolucionDto: UpdateDevolucionDto,
  ) {
    return this.devolucionesService.update(id, updateDevolucionDto);
  }
}
