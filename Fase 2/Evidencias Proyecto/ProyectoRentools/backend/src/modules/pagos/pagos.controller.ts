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
import { PagosService } from './pagos.service';
import { CreatePagoDto, UpdatePagoDto, SearchPagoDto } from './dto';
import { RolesGuard } from '../rol/guards/roles.guard';
import { Roles } from '../rol/decorators/roles.decorator';

@Controller('pagos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  /**
   * POST /pagos
   * Registra un nuevo pago
   * Valida contrato, monto y fecha
   */
  @Post()
  @Roles('admin', 'vendedor')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPagoDto: CreatePagoDto) {
    return this.pagosService.create(createPagoDto);
  }

  /**
   * GET /pagos/stats
   * Obtiene estadísticas de pagos
   * Total recaudado, por método de pago, por mes
   */
  @Get('stats')
  @Roles('admin')
  getStats() {
    return this.pagosService.getStats();
  }

  /**
   * GET /pagos/contrato/:id_contrato/resumen
   * Obtiene un resumen completo de pagos de un contrato
   * Incluye: monto total, total pagado, saldo pendiente, lista de pagos
   */
  @Get('contrato/:id_contrato/resumen')
  @Roles('admin', 'vendedor')
  getResumenContrato(@Param('id_contrato', ParseIntPipe) id_contrato: number) {
    return this.pagosService.getResumenContrato(id_contrato);
  }

  /**
   * GET /pagos/contrato/:id_contrato
   * Obtiene todos los pagos de un contrato específico
   */
  @Get('contrato/:id_contrato')
  @Roles('admin', 'vendedor')
  findByContrato(@Param('id_contrato', ParseIntPipe) id_contrato: number) {
    return this.pagosService.findByContrato(id_contrato);
  }

  /**
   * GET /pagos
   * Lista todos los pagos con búsqueda y paginación
   * Filtros: id_contrato, metodo_pago, fecha_pago, fecha_desde, fecha_hasta
   */
  @Get()
  @Roles('admin', 'vendedor')
  findAll(@Query() searchDto: SearchPagoDto) {
    return this.pagosService.findAll(searchDto);
  }

  /**
   * GET /pagos/:id
   * Obtiene un pago específico con todas sus relaciones
   */
  @Get(':id')
  @Roles('admin', 'vendedor')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pagosService.findOne(id);
  }

  /**
   * PATCH /pagos/:id
   * Actualiza un pago (solo referencia)
   * NO permite cambiar monto ni método
   */
  @Patch(':id')
  @Roles('admin', 'vendedor')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePagoDto: UpdatePagoDto,
  ) {
    return this.pagosService.update(id, updatePagoDto);
  }

  /**
   * DELETE /pagos/:id
   * Elimina un pago (solo si no tiene DTE asociado)
   */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.pagosService.delete(id);
  }
}
