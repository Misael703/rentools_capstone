import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HerramientasService } from './herramientas.service';
import {
  CreateHerramientaDto,
  UpdateHerramientaDto,
  SearchHerramientaDto,
  ImportarHerramientaDto
} from './dto/index';
import { RolesGuard } from '../rol/guards/roles.guard';
import { Roles } from '../rol/decorators/roles.decorator';

@Controller('herramientas')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class HerramientasController {
  constructor(private readonly herramientasService: HerramientasService) {}

  /**
   * GET /herramientas/verificar-sku/:sku
   * Verifica si un SKU ya existe
   * Retorna { existe: true } si ya existe, { existe: false } si está disponible
   */
  @Get('verificar-sku/:sku')
  @Roles('admin', 'vendedor')
  verificarSku(@Param('sku') sku: string) {
    return this.herramientasService.verificarSku(sku);
  }

  /**
   * GET /herramientas/verificar-barcode/:barcode
   * Verifica si un código de barras ya existe en Bsale
   * Retorna { existe: boolean, sku?: string }
   */
  @Get('verificar-barcode/:barcode')
  @Roles('admin', 'vendedor')
  verificarBarcode(@Param('barcode') barcode: string) {
    return this.herramientasService.verificarBarcode(barcode);
  }

  /**
   * POST /herramientas/importar-desde-bsale
   * Importa una herramienta existente desde Bsale
   * Requiere que la variante YA exista en Bsale
   */
  @Post('importar-desde-bsale')
  @Roles('admin', 'vendedor')
  importarDesdeBsale(@Body() importarDto: ImportarHerramientaDto) {
    return this.herramientasService.importarDesdeBsale(importarDto);
  }

  /**
   * POST /herramientas
   * Crea una herramienta manualmente
   * IMPORTANTE: Retorna 409 Conflict si el SKU ya existe
   */
  @Post()
  @Roles('admin', 'vendedor')
  create(@Body() createHerramientaDto: CreateHerramientaDto) {
    return this.herramientasService.create(createHerramientaDto);
  }

  /**
   * GET /herramientas
   * Lista todas las herramientas con búsqueda y paginación
   */
  @Get()
  @Roles('admin', 'vendedor')
  findAll(@Query() searchDto: SearchHerramientaDto) {
    return this.herramientasService.findAll(searchDto);
  }

  /**
   * GET /herramientas/disponibles
   * Lista solo herramientas disponibles (activas y con stock)
   */
  @Get('disponibles')
  @Roles('admin', 'vendedor')
  findDisponibles(@Query() searchDto: SearchHerramientaDto) {
    return this.herramientasService.findDisponibles(searchDto);
  }

  /**
   * GET /herramientas/stats
   * Obtiene estadísticas generales
   */
  @Get('stats')
  @Roles('admin')
  getStats() {
    return this.herramientasService.getStats();
  }

  /**
   * POST /herramientas/sync-from-bsale
   * Sincroniza todas las herramientas desde Bsale
   */
  @Post('sync-from-bsale')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  syncFromBsale() {
    return this.herramientasService.syncAllFromBsale();
  }

  /**
   * GET /herramientas/sku/:sku
   * Busca una herramienta por SKU
   */
  @Get('sku/:sku')
  @Roles('admin', 'vendedor')
  findBySku(@Param('sku') sku: string) {
    return this.herramientasService.findBySku(sku);
  }

  /**
   * POST /herramientas/sync-sku/:sku
   * Sincroniza una herramienta específica desde Bsale por SKU
   */
  @Post('sync-sku/:sku')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  syncOneBySku(@Param('sku') sku: string) {
    return this.herramientasService.syncOneBySku(sku);
  }

  /**
   * GET /herramientas/:id
   * Obtiene una herramienta por ID
   */
  @Get(':id')
  @Roles('admin', 'vendedor')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.herramientasService.findOne(id);
  }

  /**
   * GET /herramientas/:id/disponibilidad
   * Verifica disponibilidad de una herramienta
   * Query params: cantidad (default: 1)
   */
  @Get(':id/disponibilidad')
  @Roles('admin', 'vendedor')
  checkDisponibilidad(
    @Param('id', ParseIntPipe) id: number,
    @Query('cantidad', new ParseIntPipe({ optional: true })) cantidad?: number,
  ) {
    return this.herramientasService.checkDisponibilidad(id, cantidad || 1);
  }

  /**
   * PATCH /herramientas/:id
   * Actualiza una herramienta
   */
  @Patch(':id')
  @Roles('admin', 'vendedor')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHerramientaDto: UpdateHerramientaDto,
  ) {
    return this.herramientasService.update(id, updateHerramientaDto);
  }

  /**
   * PATCH /herramientas/:id/activate
   * Reactiva una herramienta
   */
  @Patch(':id/activate')
  @Roles('admin')
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.herramientasService.activate(id);
  }

  /**
   * DELETE /herramientas/:id
   * Soft delete: desactiva una herramienta
   */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.herramientasService.remove(id);
  }
}
