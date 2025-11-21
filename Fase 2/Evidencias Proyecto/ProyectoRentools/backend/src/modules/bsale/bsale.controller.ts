import { Controller, Get, Post, Delete, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
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

  /**
   * GET /bsale/products-config
   * Obtiene la configuración de productos de arriendo
   */
  @Get('products-config')
  @Roles('admin')
  async getProductConfigs() {
    return await this.bsaleService.getProductConfigs();
  }

  /**
   * POST /bsale/products-config/:productId
   * Agrega un producto a la configuración de arriendo
   * El nombre se obtiene automáticamente desde bsale_products
   */
  @Post('products-config/:productId')
  @Roles('admin')
  async addProductConfig(
    @Param('productId', ParseIntPipe) productId: number
  ) {
    return await this.bsaleService.addProductConfig(productId);
  }

  /**
   * DELETE /bsale/products-config/:id
   * Elimina un producto de la configuración (hard delete)
   * Desactiva automáticamente todas las herramientas de ese producto
   * El producto sigue existiendo en bsale_products y puede volver a agregarse
   */
  @Delete('products-config/:id')
  @Roles('admin')
  async removeProductConfig(@Param('id', ParseIntPipe) id: number) {
    return await this.bsaleService.removeProductConfig(id);
  }

  /**
   * POST /bsale/products/sync
   * Sincroniza todos los productos desde Bsale hacia la BD local
   */
  @Post('products/sync')
  @Roles('admin')
  async syncProducts() {
    const result = await this.bsaleService.syncProductsFromBsale();
    return {
      message: 'Sincronización completada',
      ...result,
    };
  }

  /**
   * GET /bsale/products/cached
   * Obtiene productos desde el caché local con paginación
   */
  @Get('products/cached')
  @Roles('admin')
  async getProductsCached(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('soloActivos') soloActivos?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    const parsedSoloActivos = soloActivos === 'true';

    return await this.bsaleService.getProductsFromCache(
      parsedLimit,
      parsedOffset,
      parsedSoloActivos,
    );
  }

  /**
   * GET /bsale/products/search
   * Busca productos en el caché por nombre
   */
  @Get('products/search')
  @Roles('admin')
  async searchProducts(
    @Query('q') searchTerm: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return await this.bsaleService.searchProductsInCache(searchTerm, parsedLimit);
  }
}