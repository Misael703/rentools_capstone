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
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ContratosService } from './contratos.service';
import {
  CreateContratoDto,
  UpdateContratoDto,
  SearchContratoDto,
} from './dto';
import { RolesGuard } from '../rol/guards/roles.guard';
import { Roles } from '../rol/decorators/roles.decorator';

@Controller('contratos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ContratosController {
  constructor(private readonly contratosService: ContratosService) {}

  /**
   * POST /contratos
   * Crea un nuevo contrato
   * El id_usuario se obtiene del token JWT
   */
  @Post()
  @Roles('admin', 'vendedor')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createContratoDto: CreateContratoDto, @Request() req) {
    const id_usuario = req.user.id_usuario;
    return this.contratosService.create(createContratoDto, id_usuario);
  }

  /**
   * GET /contratos/stats
   * Obtiene estadísticas generales de contratos
   */
  @Get('stats')
  @Roles('admin', 'vendedor')
  getStats() {
    return this.contratosService.getStats();
  }

  /**
   * GET /contratos/vencidos
   * Obtiene contratos vencidos (fecha_termino_estimada < HOY y estado = ACTIVO)
   */
  @Get('vencidos')
  @Roles('admin', 'vendedor')
  getVencidos() {
    return this.contratosService.getVencidos();
  }

  /**
   * GET /contratos/cliente/:id_cliente
   * Obtiene contratos de un cliente específico
   */
  @Get('cliente/:id_cliente')
  @Roles('admin', 'vendedor')
  findByCliente(
    @Param('id_cliente', ParseIntPipe) id_cliente: number,
    @Query() searchDto: SearchContratoDto,
  ) {
    return this.contratosService.findByCliente(id_cliente, searchDto);
  }

  /**
   * GET /contratos/usuario/:id_usuario
   * Obtiene contratos de un usuario específico
   */
  @Get('usuario/:id_usuario')
  @Roles('admin', 'vendedor')
  findByUsuario(
    @Param('id_usuario', ParseIntPipe) id_usuario: number,
    @Query() searchDto: SearchContratoDto,
  ) {
    return this.contratosService.findByUsuario(id_usuario, searchDto);
  }

  /**
   * GET /contratos
   * Lista todos los contratos con búsqueda y paginación
   */
  @Get()
  @Roles('admin', 'vendedor')
  findAll(@Query() searchDto: SearchContratoDto) {
    return this.contratosService.findAll(searchDto);
  }

  /**
   * GET /contratos/:id
   * Obtiene un contrato específico con todas sus relaciones
   */
  @Get(':id')
  @Roles('admin', 'vendedor')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contratosService.findOne(id);
  }

  /**
   * PATCH /contratos/:id
   * Actualiza un contrato (solo campos permitidos)
   * Solo se puede actualizar si está activo
   */
  @Patch(':id')
  @Roles('admin', 'vendedor')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContratoDto: UpdateContratoDto,
  ) {
    return this.contratosService.update(id, updateContratoDto);
  }

  /**
   * PATCH /contratos/:id/finalizar
   * Finaliza un contrato y calcula el monto final
   */
  @Patch(':id/finalizar')
  @Roles('admin', 'vendedor')
  finalizar(@Param('id', ParseIntPipe) id: number) {
    return this.contratosService.calcularMontoFinal(id);
  }

  /**
   * DELETE /contratos/:id
   * Cancela un contrato y devuelve el stock
   * Solo se puede cancelar si está activo
   */
  @Delete(':id')
  @Roles('admin', 'vendedor')
  @HttpCode(HttpStatus.OK)
  cancelar(@Param('id', ParseIntPipe) id: number) {
    return this.contratosService.cancelar(id);
  }
}
