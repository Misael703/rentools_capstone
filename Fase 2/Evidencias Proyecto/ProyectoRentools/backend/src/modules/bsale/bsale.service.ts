import { Injectable, Logger, BadGatewayException, Inject, forwardRef } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { BsaleCliente, BsaleApiResponse } from './interfaces/bsale-cliente.interface';
import { BsaleConfig } from './entities/bsale-config.entity';
import { BsaleProduct } from './entities/bsale-product.entity';
import { HerramientasService } from '../herramientas/herramientas.service';

@Injectable()
export class BsaleService {
  private readonly logger = new Logger(BsaleService.name);
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(BsaleConfig)
    private readonly bsaleConfigRepository: Repository<BsaleConfig>,
    @InjectRepository(BsaleProduct)
    private readonly bsaleProductRepository: Repository<BsaleProduct>,
    @Inject(forwardRef(() => HerramientasService))
    private readonly herramientasService: HerramientasService,
  ) {
    this.baseUrl = this.configService.get<string>('BSALE_BASE_URL')!;
    this.token = this.configService.get<string>('BSALE_API_KEY')!;

    if (!this.baseUrl || !this.token) {
      this.logger.warn('⚠️  Credenciales de Bsale no configuradas');
    } else {
      this.logger.log(`✅ Bsale Service inicializado`);
      this.logger.debug(`🔍 Base URL: ${this.baseUrl}`);
      this.logger.debug(`🔍 Token: ${this.token.substring(0, 10)}...`);
    }
  }

  /**
   * Obtiene los IDs de productos configurados para arriendo desde la BD
   */
  async getProductIdsArriendo(): Promise<number[]> {
    const configs = await this.bsaleConfigRepository.find({
      select: ['product_id_bsale'],
    });

    const ids = configs.map(c => c.product_id_bsale);

    if (ids.length === 0) {
      this.logger.warn('⚠️  No hay productos de arriendo configurados en BD');
    }

    return ids;
  }

  /**
   * Headers para peticiones a Bsale
   */
  private getHeaders() {
    return {
      'access_token': this.token,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Manejo de errores centralizado
   */
  private handleError(error: any, context: string): never {
    this.logger.error(`Error en ${context}:`, error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      throw new BadGatewayException('Token de Bsale inválido o expirado');
    }
    
    if (error.response?.status === 404) {
      return null as never;
    }

    throw new BadGatewayException(`Error al conectar con Bsale: ${context}`);
  }

  /**
   * Obtiene todos los clientes de Bsale (con paginación)
   */
  async getAllClientes(): Promise<BsaleCliente[]> {
    try {
      const allClientes: BsaleCliente[] = [];
      let offset = 0;
      const limit = 50;
      let hasMore = true;

      this.logger.log('📥 Iniciando obtención de clientes desde Bsale...');

      while (hasMore) {
        const response = await firstValueFrom(
          this.httpService.get<BsaleApiResponse<BsaleCliente>>(
            `${this.baseUrl}/clients.json`,
            {
              headers: this.getHeaders(),
              params: { limit, offset },
            }
          )
        );

        const clientes = response.data.items || [];
        allClientes.push(...clientes);

        hasMore = clientes.length === limit;
        offset += limit;

        this.logger.log(`📥 Obtenidos ${allClientes.length} clientes...`);
      }

      this.logger.log(`✅ Total: ${allClientes.length} clientes obtenidos`);
      return allClientes;

    } catch (error) {
      this.handleError(error, 'getAllClientes');
    }
  }

  /**
   * Busca un cliente por RUT en Bsale
   */
  async findClienteByRut(rut: string): Promise<BsaleCliente | null> {
    try {
      this.logger.log(`🔍 Buscando cliente ${rut} en Bsale...`);

      const response = await firstValueFrom(
        this.httpService.get<BsaleApiResponse<BsaleCliente>>(
          `${this.baseUrl}/clients.json`,
          {
            headers: this.getHeaders(),
            params: { code: rut },
          }
        )
      );

      const clientes = response.data.items || [];
      
      if (clientes.length === 0) {
        this.logger.log(`❌ Cliente ${rut} no encontrado en Bsale`);
        return null;
      }

      this.logger.log(`✅ Cliente ${rut} encontrado en Bsale`);
      return clientes[0];

    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      this.handleError(error, `findClienteByRut(${rut})`);
    }
  }

  /**
   * Crea un cliente en Bsale
   */
  async createCliente(data: {
    rut: string;
    tipo_cliente: string;
    nombre?: string;
    apellido?: string;
    razon_social?: string;
    nombre_fantasia?: string;
    giro?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    comuna?: string;
  }): Promise<BsaleCliente> {
    try {
      this.logger.log(`📤 Creando cliente ${data.rut} en Bsale...`);

      const payload: any = {
        code: data.rut,
        email: data.email || '',
        phone: data.telefono || '',
        address: data.direccion || '',
        city: data.ciudad || '',
        municipality: data.comuna || '',
      };

      // Según tipo de cliente
      if (data.tipo_cliente === 'persona_natural') {
        payload.firstName = data.nombre || '';
        payload.lastName = data.apellido || '';
        payload.companyOrPerson = 0
      } else {
        payload.company = data.razon_social || '';
        payload.activity = data.giro || '';
        payload.companyOrPerson = 1;
      }

      const response = await firstValueFrom(
        this.httpService.post<BsaleCliente>(
          `${this.baseUrl}/clients.json`,
          payload,
          { headers: this.getHeaders() }
        )
      );

      this.logger.log(`✅ Cliente ${data.rut} creado en Bsale con ID ${response.data.id}`);
      return response.data;

    } catch (error) {
      this.handleError(error, `createCliente(${data.rut})`);
    }
  }

  /**
   * Actualiza un cliente en Bsale
   */
  async updateCliente(
    idBsale: number,
    data: {
      tipo_cliente?: string;
      nombre?: string;
      apellido?: string;
      razon_social?: string;
      nombre_fantasia?: string;
      giro?: string;
      email?: string;
      telefono?: string;
      direccion?: string;
      ciudad?: string;
      comuna?: string;
    }
  ): Promise<BsaleCliente> {
    try {
      this.logger.log(`📤 Actualizando cliente ${idBsale} en Bsale...`);

      const payload: any = {};

      if (data.email) payload.email = data.email;
      if (data.telefono) payload.phone = data.telefono;
      if (data.direccion) payload.address = data.direccion;
      if (data.ciudad) payload.city = data.ciudad;
      if (data.comuna) payload.municipality = data.comuna;

      if (data.tipo_cliente === 'persona_natural') {
        if (data.nombre) payload.firstName = data.nombre;
        if (data.apellido) payload.lastName = data.apellido;
        if (data.tipo_cliente) payload.companyOrPerson = 0;
      } else {
        if (data.razon_social) payload.company = data.razon_social;
        if (data.giro) payload.activity = data.giro;
        if (data.tipo_cliente) payload.companyOrPerson = 1;
      }

      const response = await firstValueFrom(
        this.httpService.put<BsaleCliente>(
          `${this.baseUrl}/clients/${idBsale}.json`,
          payload,
          { headers: this.getHeaders() }
        )
      );

      this.logger.log(`✅ Cliente ${idBsale} actualizado en Bsale`);
      return response.data;

    } catch (error) {
      this.handleError(error, `updateCliente(${idBsale})`);
    }
  }

  /**
   * Actualiza solo el estado de un cliente en Bsale
   * @param idBsale ID del cliente en Bsale
   * @param state 0 = activo, 1 = inactivo
   */
  async updateClienteState(idBsale: number, state: 0 | 1): Promise<void> {
    try {
      this.logger.log(`📤 Actualizando estado del cliente ${idBsale} en Bsale a ${state === 0 ? 'activo' : 'inactivo'}...`);

      await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/clients/${idBsale}.json`,
          { state },
          { headers: this.getHeaders() }
        )
      );

      this.logger.log(`✅ Estado del cliente ${idBsale} actualizado en Bsale`);

    } catch (error) {
      this.handleError(error, `updateClienteState(${idBsale}, ${state})`);
    }
  }


  /**
   * Obtiene un cliente por ID de Bsale
   */
  async getClienteById(idBsale: number): Promise<BsaleCliente | null> {
    try {
      this.logger.log(`🔍 Obteniendo cliente ${idBsale} de Bsale...`);

      const response = await firstValueFrom(
        this.httpService.get<BsaleCliente>(
          `${this.baseUrl}/clients/${idBsale}.json`,
          { headers: this.getHeaders() }
        )
      );

      this.logger.log(`✅ Cliente ${idBsale} obtenido de Bsale`);
      return response.data;

    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      this.handleError(error, `getClienteById(${idBsale})`);
    }
  }

    // ============================================
  // MÉTODOS PARA HERRAMIENTAS / PRODUCTOS
  // ============================================

  /**
   * Obtiene todas las variantes de productos de arriendo
   * Filtra por los product_ids configurados en BD
   * NOTA: Solo trae info básica (SKU, nombre, descripción, barcode)
   * Stock y precios se agregarán después cuando tengamos los endpoints
   */
  async getAllVariantsArriendo(): Promise<any[]> {
    try {
      const productIdsArriendo = await this.getProductIdsArriendo();

      if (productIdsArriendo.length === 0) {
        this.logger.warn('⚠️  No hay product IDs configurados. Retornando array vacío.');
        return [];
      }

      const allVariants: any[] = [];

      this.logger.log(`📦 Obteniendo variantes de productos: [${productIdsArriendo.join(', ')}]`);

      // Iterar sobre cada product_id configurado
      for (const productId of productIdsArriendo) {
        try {
          this.logger.log(`📦 Obteniendo variantes del producto ${productId}...`);

          // Paginación para obtener todas las variantes del producto
          let offset = 0;
          const limit = 50;
          let hasMore = true;
          let variantsCount = 0;

          while (hasMore) {
            const response = await firstValueFrom(
              this.httpService.get<BsaleApiResponse<any>>(
                `${this.baseUrl}/products/${productId}/variants.json`,
                {
                  headers: this.getHeaders(),
                  params: { limit, offset },
                }
              )
            );

            const variants = response.data.items || [];

            // Agregar productId a cada variante para mantener el contexto
            const variantsWithProductId = variants.map(v => ({
              ...v,
              productId: productId,
            }));

            allVariants.push(...variantsWithProductId);
            variantsCount += variants.length;

            hasMore = variants.length === limit;
            offset += limit;

            this.logger.debug(`📦 Producto ${productId}: ${variantsCount} variantes obtenidas hasta ahora...`);
          }

          this.logger.log(`✅ Producto ${productId}: ${variantsCount} variantes obtenidas en total`);

        } catch (error) {
          if (error.response?.status === 404) {
            this.logger.warn(`⚠️  Producto ${productId} no encontrado en Bsale`);
          } else {
            this.logger.error(`❌ Error obteniendo variantes del producto ${productId}:`, error.message);
          }
          // Continuar con el siguiente producto
        }
      }

      this.logger.log(`✅ Total: ${allVariants.length} variantes de arriendo obtenidas`);
      return allVariants;

    } catch (error) {
      this.handleError(error, 'getAllVariantsArriendo');
    }
  }

  /**
   * Busca una variante específica por SKU
   * Útil para verificar si existe antes de crear
   */
  async findVariantBySku(sku: string): Promise<any | null> {
    try {
      this.logger.log(`🔍 Buscando variante ${sku} en Bsale...`);

      const response = await firstValueFrom(
        this.httpService.get<BsaleApiResponse<any>>(
          `${this.baseUrl}/variants.json`,
          {
            headers: this.getHeaders(),
            params: { code: sku },
          }
        )
      );

      const variants = response.data.items || [];

      if (variants.length === 0) {
        this.logger.log(`❌ Variante ${sku} no encontrada en Bsale`);
        return null;
      }

      this.logger.log(`✅ Variante ${sku} encontrada en Bsale`);
      return variants[0];

    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      this.handleError(error, `findVariantBySku(${sku})`);
    }
  }

  /**
   * Busca una variante por código de barras
   * Retorna null si no existe
   */
  async findVariantByBarcode(barcode: string): Promise<any | null> {
    try {
      if (!barcode || barcode.trim() === '') {
        return null;
      }

      this.logger.log(`🔍 Buscando variante con barcode ${barcode} en Bsale...`);

      const response = await firstValueFrom(
        this.httpService.get<BsaleApiResponse<any>>(
          `${this.baseUrl}/variants.json`,
          {
            headers: this.getHeaders(),
            params: { barcode: barcode },
          }
        )
      );

      const variants = response.data.items || [];

      if (variants.length === 0) {
        this.logger.log(`❌ Variante con barcode ${barcode} no encontrada`);
        return null;
      }

      this.logger.log(`✅ Variante con barcode ${barcode} encontrada en Bsale (SKU: ${variants[0].code})`);
      return variants[0];

    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      this.handleError(error, `findVariantByBarcode(${barcode})`);
    }
  }

  /**
   * Crea una nueva variante en Bsale
   * @param data Datos de la variante a crear (debe incluir productId)
   */
  async createVariant(data: {
    productId: number;
    sku: string;
    nombre: string;
    descripcion?: string;
    barcode?: string;
  }): Promise<any> {
    try {
      this.logger.log(`📤 Creando variante ${data.sku} en Bsale (producto ${data.productId})...`);

      const payload: any = {
        productId: data.productId,
        description: data.nombre,
        unlimitedStock: 0,
        allowNegativeStock: 0,
        code: data.sku,
      };

      // Agregar barcode solo si viene
      if (data.barcode) {
        payload.barCode = data.barcode;
      }

      const response = await firstValueFrom(
        this.httpService.post<any>(
          `${this.baseUrl}/variants.json`,
          payload,
          { headers: this.getHeaders() }
        )
      );

      this.logger.log(`✅ Variante ${data.sku} creada en Bsale con ID ${response.data.id}`);
      return response.data;

    } catch (error) {
      this.handleError(error, `createVariant(${data.sku})`);
    }
  }

  /**
   * Actualiza una variante existente en Bsale
   * @param idBsale ID de la variante en Bsale (va en la URL y en el payload como "id")
   * @param data Datos a actualizar
   */
  async updateVariant(
    idBsale: number,
    data: {
      sku?: string;
      nombre?: string;
      barcode?: string;
    }
  ): Promise<any> {
    try {
      const url = `${this.baseUrl}/variants/${idBsale}.json`;

      this.logger.log(`📤 Actualizando variante ${idBsale} en Bsale...`);
      this.logger.debug(`🔍 URL: ${url}`);

      const payload: any = {
        id: idBsale, // OBLIGATORIO: debe ser el id_bsale
      };

      // Solo incluir campos que vienen
      if (data.sku) {
        payload.code = data.sku;
      }

      if (data.nombre) {
        payload.description = data.nombre;
      }

      if (data.barcode !== undefined) {
        payload.barCode = data.barcode || ''; // Permite limpiar el barcode
      }

      this.logger.debug(`🔍 Payload que se enviará a Bsale:`);
      this.logger.debug(JSON.stringify(payload, null, 2));

      const response = await firstValueFrom(
        this.httpService.put<any>(
          url,
          payload,
          { headers: this.getHeaders() }
        )
      );

      this.logger.log(`✅ Variante ${idBsale} actualizada en Bsale`);
      return response.data;

    } catch (error) {
      this.logger.error(`❌ Error actualizando variante ${idBsale}:`);
      this.logger.error(`   URL: ${this.baseUrl}/variants/${idBsale}.json`);
      this.logger.error(`   Payload enviado: ${JSON.stringify({
        id: idBsale,
        code: data.sku,
        description: data.nombre,
        barCode: data.barcode,
      }, null, 2)}`);
      this.handleError(error, `updateVariant(${idBsale})`);
    }
  }

  /**
   * Verifica conexión con Bsale
   */
  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/clients.json`;
      this.logger.debug(`🔍 Testing connection to: ${url}`);

      await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getHeaders(),
          params: { limit: 1 },
        })
      );
      this.logger.log('✅ Conexión con Bsale exitosa');
      return true;
    } catch (error) {
      this.logger.error('❌ Error conectando con Bsale:', error.message);
      this.logger.error(`🔍 URL intentada: ${this.baseUrl}/clients.json`);
      return false;
    }
  }

  // ============================================
  // GESTIÓN DE CONFIGURACIÓN DE PRODUCTOS
  // ============================================

  /**
   * Obtiene todos los productos desde Bsale con paginación
   */
  async getAllProducts(): Promise<any[]> {
    try {
      const allProducts: any[] = [];
      let offset = 0;
      const limit = 50;
      let hasMore = true;

      this.logger.log('📦 Obteniendo todos los productos desde Bsale...');

      while (hasMore) {
        const response = await firstValueFrom(
          this.httpService.get<BsaleApiResponse<any>>(
            `${this.baseUrl}/products.json`,
            {
              headers: this.getHeaders(),
              params: { limit, offset },
            }
          )
        );

        const products = response.data.items || [];
        allProducts.push(...products);

        hasMore = products.length === limit;
        offset += limit;

        this.logger.debug(`📦 ${allProducts.length} productos obtenidos hasta ahora...`);
      }

      this.logger.log(`✅ Total: ${allProducts.length} productos obtenidos`);
      return allProducts;

    } catch (error) {
      this.handleError(error, 'getAllProducts');
    }
  }

  /**
   * Agrega un producto a la configuración de arriendo
   * Valida que el producto exista en caché y esté activo (state=0) antes de agregarlo
   * Obtiene el nombre automáticamente desde bsale_products
   * Sincroniza automáticamente todas las variantes del producto desde Bsale
   */
  async addProductConfig(productIdBsale: number): Promise<{
    config: BsaleConfig;
    variantesSincronizadas: number;
    herramientasCreadas: number;
    herramientasActualizadas: number;
  }> {
    // Verificar si el producto existe en caché
    const productoCacheado = await this.bsaleProductRepository.findOne({
      where: { product_id_bsale: productIdBsale },
    });

    if (!productoCacheado) {
      throw new BadGatewayException(
        `Producto ${productIdBsale} no encontrado en caché. Ejecuta primero POST /bsale/products/sync`
      );
    }

    if (productoCacheado.state === 1) {
      throw new BadGatewayException(
        `No se puede agregar el producto "${productoCacheado.name}" porque está inactivo en Bsale`
      );
    }

    // Verificar si ya existe en la configuración
    const existe = await this.bsaleConfigRepository.findOne({
      where: { product_id_bsale: productIdBsale },
    });

    let config: BsaleConfig;

    if (existe) {
      // Si ya existe, retornar error (ya está en configuración)
      throw new BadGatewayException(
        `El producto "${productoCacheado.name}" ya está en la configuración`
      );
    }

    // Crear nueva configuración con el nombre desde caché
    config = this.bsaleConfigRepository.create({
      product_id_bsale: productIdBsale,
      product_name: productoCacheado.name,
    });
    config = await this.bsaleConfigRepository.save(config);
    this.logger.log(`✅ Producto ${productIdBsale} agregado a configuración: "${productoCacheado.name}"`);

    // Actualizar flag en_configuracion en el producto cacheado
    await this.updateProductConfigFlag(productIdBsale, true);

    // Sincronizar todas las herramientas de todos los productos configurados
    // Esto incluirá las variantes del producto recién agregado + actualizará las existentes
    this.logger.log(`🔄 Sincronizando herramientas desde Bsale...`);
    const resultadoSync = await this.herramientasService.syncAllFromBsale();

    this.logger.log(
      `✅ Producto ${productIdBsale} ("${productoCacheado.name}") agregado y sincronizado: ` +
      `${resultadoSync.nuevas} herramientas nuevas, ${resultadoSync.actualizadas} actualizadas`
    );

    return {
      config,
      variantesSincronizadas: resultadoSync.total,
      herramientasCreadas: resultadoSync.nuevas,
      herramientasActualizadas: resultadoSync.actualizadas,
    };
  }

  /**
   * Obtiene la configuración de productos de arriendo
   */
  async getProductConfigs(): Promise<BsaleConfig[]> {
    return await this.bsaleConfigRepository.find({
      order: { product_name: 'ASC' },
    });
  }

  /**
   * Obtiene la configuración de un producto específico por su product_id_bsale
   */
  async getProductConfigByProductId(productIdBsale: number): Promise<BsaleConfig | null> {
    return await this.bsaleConfigRepository.findOne({
      where: { product_id_bsale: productIdBsale },
    });
  }

  /**
   * Elimina un producto de la configuración (hard delete)
   * Desactiva automáticamente todas las herramientas de ese producto
   * El producto sigue existiendo en bsale_products (caché)
   */
  async removeProductConfig(id: number): Promise<{ message: string; herramientasDesactivadas: number }> {
    const config = await this.bsaleConfigRepository.findOne({ where: { id } });

    if (!config) {
      throw new BadGatewayException('Configuración no encontrada');
    }

    const productIdBsale = config.product_id_bsale;
    const productName = config.product_name;

    // 1. Desactivar todas las herramientas de este producto
    const resultado = await this.herramientasService.deactivateByProductId(productIdBsale);

    // 2. Eliminar el registro de la configuración (hard delete)
    await this.bsaleConfigRepository.remove(config);

    // 3. Actualizar flag en_configuracion en el producto cacheado
    await this.updateProductConfigFlag(productIdBsale, false);

    this.logger.log(
      `✅ Producto ${productIdBsale} ("${productName}") eliminado de configuración. ` +
      `${resultado.desactivadas} herramientas desactivadas.`
    );

    return {
      message: `Producto "${productName}" eliminado de la configuración`,
      herramientasDesactivadas: resultado.desactivadas,
    };
  }

  // ============================================
  // GESTIÓN DE CACHÉ DE PRODUCTOS
  // ============================================

  /**
   * Sincroniza todos los productos desde Bsale hacia la BD local
   * Guarda: product_id_bsale, name, state
   * Actualiza el flag en_configuracion según bsale_config
   */
  async syncProductsFromBsale(): Promise<{ total: number; nuevos: number; actualizados: number }> {
    try {
      this.logger.log('🔄 Iniciando sincronización de productos desde Bsale...');

      // 1. Obtener todos los productos desde Bsale
      const productosFromBsale = await this.getAllProducts();

      let nuevos = 0;
      let actualizados = 0;

      // 2. Obtener IDs de productos en configuración
      const productosEnConfig = await this.bsaleConfigRepository.find({
        select: ['product_id_bsale'],
      });
      const idsEnConfig = new Set(productosEnConfig.map(c => c.product_id_bsale));

      // 3. Procesar cada producto
      for (const productoBsale of productosFromBsale) {
        try {
          // Validar que tenga ID
          if (!productoBsale.id) {
            this.logger.warn(`⚠️  Producto sin ID encontrado, omitiendo...`);
            continue;
          }

          const productoExistente = await this.bsaleProductRepository.findOne({
            where: { product_id_bsale: productoBsale.id },
          });

          const enConfiguracion = idsEnConfig.has(productoBsale.id);

          // Usar nombre por defecto si viene null
          const nombreProducto = productoBsale.name || `Producto ${productoBsale.id}`;
          const estadoProducto = productoBsale.state ?? 0;

          if (productoExistente) {
            // Actualizar producto existente
            productoExistente.name = nombreProducto;
            productoExistente.state = estadoProducto;
            productoExistente.en_configuracion = enConfiguracion;
            productoExistente.fecha_sincronizacion = new Date();
            productoExistente.updated_at = new Date();
            await this.bsaleProductRepository.save(productoExistente);
            actualizados++;
          } else {
            // Crear nuevo producto
            const nuevoProducto = this.bsaleProductRepository.create({
              product_id_bsale: productoBsale.id,
              name: nombreProducto,
              state: estadoProducto,
              en_configuracion: enConfiguracion,
              fecha_sincronizacion: new Date(),
            });
            await this.bsaleProductRepository.save(nuevoProducto);
            nuevos++;
          }

          // Log cada 1000 productos
          if ((nuevos + actualizados) % 1000 === 0) {
            this.logger.log(`📦 Procesados ${nuevos + actualizados} productos...`);
          }
        } catch (productError) {
          this.logger.error(`❌ Error procesando producto ${productoBsale.id}:`, productError.message);
          // Continuar con el siguiente producto
          continue;
        }
      }

      this.logger.log(`✅ Sincronización completada: ${nuevos} nuevos, ${actualizados} actualizados`);

      return {
        total: productosFromBsale.length,
        nuevos,
        actualizados,
      };

    } catch (error) {
      this.logger.error('❌ Error sincronizando productos:', error.message);
      throw new BadGatewayException('Error al sincronizar productos desde Bsale');
    }
  }

  /**
   * Obtiene productos desde el caché local con paginación
   * @param limit Número de productos por página
   * @param offset Desplazamiento
   * @param soloActivos Si true, solo retorna productos con state=0
   */
  async getProductsFromCache(
    limit: number = 50,
    offset: number = 0,
    soloActivos: boolean = false
  ): Promise<{ items: BsaleProduct[]; total: number }> {
    try {
      const where = soloActivos ? { state: 0 } : {};

      const [items, total] = await this.bsaleProductRepository.findAndCount({
        where,
        order: { name: 'ASC' },
        take: limit,
        skip: offset,
      });

      return { items, total };

    } catch (error) {
      this.logger.error('❌ Error obteniendo productos desde caché:', error.message);
      throw new BadGatewayException('Error al obtener productos desde caché');
    }
  }

  /**
   * Busca productos en el caché por nombre
   * @param searchTerm Término de búsqueda
   * @param limit Límite de resultados
   */
  async searchProductsInCache(searchTerm: string, limit: number = 50): Promise<BsaleProduct[]> {
    try {
      const productos = await this.bsaleProductRepository
        .createQueryBuilder('product')
        .where('LOWER(product.name) LIKE LOWER(:searchTerm)', {
          searchTerm: `%${searchTerm}%`,
        })
        .orderBy('product.name', 'ASC')
        .take(limit)
        .getMany();

      return productos;

    } catch (error) {
      this.logger.error('❌ Error buscando productos en caché:', error.message);
      throw new BadGatewayException('Error al buscar productos en caché');
    }
  }

  /**
   * Actualiza el flag en_configuracion de un producto
   * Se llama cuando se agrega/remueve un producto de la configuración
   */
  async updateProductConfigFlag(productIdBsale: number, enConfiguracion: boolean): Promise<void> {
    try {
      const producto = await this.bsaleProductRepository.findOne({
        where: { product_id_bsale: productIdBsale },
      });

      if (producto) {
        producto.en_configuracion = enConfiguracion;
        producto.updated_at = new Date();
        await this.bsaleProductRepository.save(producto);
        this.logger.log(`✅ Flag en_configuracion actualizado para producto ${productIdBsale}: ${enConfiguracion}`);
      }

    } catch (error) {
      this.logger.error(`❌ Error actualizando flag en_configuracion para producto ${productIdBsale}:`, error.message);
    }
  }
}
