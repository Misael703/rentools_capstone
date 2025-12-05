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
import { GarantiasService } from './garantias.service';
import {
  CreateGarantiaPagoDto,
  UpdateGarantiaPagoDto,
  SearchGarantiaPagoDto,
  CreateGarantiaDevolucionDto,
  UpdateGarantiaDevolucionDto,
  SearchGarantiaDevolucionDto,
} from './dto';
import { RolesGuard } from '../rol/guards/roles.guard';
import { Roles } from '../rol/decorators/roles.decorator';

@Controller('garantias')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class GarantiasController {
  constructor(private readonly garantiasService: GarantiasService) {}

  // ==================== GARANTÍA PAGO ====================

  /**
   * POST /garantias/pago
   * Registra un pago de garantía para un contrato
   * Valida que el contrato existe, está activo y no tiene otra garantía
   */
  @Post('pago')
  @Roles('admin', 'vendedor')
  @HttpCode(HttpStatus.CREATED)
  createPago(@Body() createDto: CreateGarantiaPagoDto) {
    return this.garantiasService.createPago(createDto);
  }

  /**
   * GET /garantias/pago/contrato/:id_contrato/verificar
   * Verifica si un contrato tiene garantía pagada
   */
  @Get('pago/contrato/:id_contrato/verificar')
  @Roles('admin', 'vendedor')
  async verificarGarantiaPagada(
    @Param('id_contrato', ParseIntPipe) id_contrato: number,
  ) {
    const pagada = await this.garantiasService.verificarGarantiaPagada(
      id_contrato,
    );
    return { id_contrato, garantia_pagada: pagada };
  }

  /**
   * GET /garantias/pago/contrato/:id_contrato
   * Obtiene la garantía pago de un contrato específico
   */
  @Get('pago/contrato/:id_contrato')
  @Roles('admin', 'vendedor')
  findPagoByContrato(
    @Param('id_contrato', ParseIntPipe) id_contrato: number,
  ) {
    return this.garantiasService.findPagoByContrato(id_contrato);
  }

  /**
   * GET /garantias/pago
   * Lista todos los pagos de garantía con búsqueda y paginación
   */
  @Get('pago')
  @Roles('admin', 'vendedor')
  findAllPagos(@Query() searchDto: SearchGarantiaPagoDto) {
    return this.garantiasService.findAllPagos(searchDto);
  }

  /**
   * GET /garantias/pago/:id
   * Obtiene un pago de garantía específico
   */
  @Get('pago/:id')
  @Roles('admin', 'vendedor')
  findOnePago(@Param('id', ParseIntPipe) id: number) {
    return this.garantiasService.findOnePago(id);
  }

  /**
   * PATCH /garantias/pago/:id
   * Actualiza un pago de garantía (solo campos seguros)
   */
  @Patch('pago/:id')
  @Roles('admin', 'vendedor')
  updatePago(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateGarantiaPagoDto,
  ) {
    return this.garantiasService.updatePago(id, updateDto);
  }

  /**
   * DELETE /garantias/pago/:id
   * Elimina un pago de garantía
   */
  @Delete('pago/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePago(@Param('id', ParseIntPipe) id: number) {
    await this.garantiasService.deletePago(id);
  }

  // ==================== GARANTÍA DEVOLUCIÓN ====================

  /**
   * POST /garantias/devolucion
   * Registra una devolución de garantía
   * Valida que el contrato está finalizado y tiene garantía pagada
   * Si no se envía monto, lo calcula automáticamente
   */
  @Post('devolucion')
  @Roles('admin', 'vendedor')
  @HttpCode(HttpStatus.CREATED)
  createDevolucion(@Body() createDto: CreateGarantiaDevolucionDto) {
    return this.garantiasService.createDevolucion(createDto);
  }

  /**
   * GET /garantias/devolucion/calcular/:id_contrato
   * Calcula el monto sugerido de devolución basado en el estado de las herramientas
   */
  @Get('devolucion/calcular/:id_contrato')
  @Roles('admin', 'vendedor')
  calcularMontoDevolucion(
    @Param('id_contrato', ParseIntPipe) id_contrato: number,
  ) {
    return this.garantiasService.calcularMontoDevolucion(id_contrato);
  }

  /**
   * GET /garantias/devolucion/info/:id_contrato
   * Obtiene toda la información necesaria para la pantalla de devolución
   */
  @Get('devolucion/info/:id_contrato')
  @Roles('admin', 'vendedor')
  getInfoDevolucion(
    @Param('id_contrato', ParseIntPipe) id_contrato: number,
  ) {
    return this.garantiasService.getInfoDevolucion(id_contrato);
  }

  /**
   * GET /garantias/devolucion/contrato/:id_contrato
   * Obtiene la devolución de garantía de un contrato específico
   */
  @Get('devolucion/contrato/:id_contrato')
  @Roles('admin', 'vendedor')
  findDevolucionByContrato(
    @Param('id_contrato', ParseIntPipe) id_contrato: number,
  ) {
    return this.garantiasService.findDevolucionByContrato(id_contrato);
  }

  /**
   * GET /garantias/devolucion
   * Lista todas las devoluciones de garantía con búsqueda y paginación
   */
  @Get('devolucion')
  @Roles('admin', 'vendedor')
  findAllDevoluciones(@Query() searchDto: SearchGarantiaDevolucionDto) {
    return this.garantiasService.findAllDevoluciones(searchDto);
  }

  /**
   * GET /garantias/devolucion/:id
   * Obtiene una devolución de garantía específica
   */
  @Get('devolucion/:id')
  @Roles('admin', 'vendedor')
  findOneDevolucion(@Param('id', ParseIntPipe) id: number) {
    return this.garantiasService.findOneDevolucion(id);
  }

  /**
   * PATCH /garantias/devolucion/:id
   * Actualiza una devolución de garantía (solo campos seguros)
   */
  @Patch('devolucion/:id')
  @Roles('admin', 'vendedor')
  updateDevolucion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateGarantiaDevolucionDto,
  ) {
    return this.garantiasService.updateDevolucion(id, updateDto);
  }

  /**
   * DELETE /garantias/devolucion/:id
   * Elimina una devolución de garantía
   */
  @Delete('devolucion/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDevolucion(@Param('id', ParseIntPipe) id: number) {
    await this.garantiasService.deleteDevolucion(id);
  }

  // ==================== RESUMEN Y REPORTES ====================

  /**
   * GET /garantias/stats
   * Obtiene estadísticas generales de garantías
   */
  @Get('stats')
  @Roles('admin')
  getStats() {
    return this.garantiasService.getStats();
  }

  /**
   * GET /garantias/resumen/:id_contrato
   * Obtiene resumen completo de garantías de un contrato
   * Incluye: pago, devolución, estado de herramientas, monto sugerido, etc.
   */
  @Get('resumen/:id_contrato')
  @Roles('admin', 'vendedor')
  getResumenContrato(
    @Param('id_contrato', ParseIntPipe) id_contrato: number,
  ) {
    return this.garantiasService.getResumenContrato(id_contrato);
  }
}
