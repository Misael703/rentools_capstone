import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { BsaleCliente, BsaleApiResponse } from './interfaces/bsale-cliente.interface';

@Injectable()
export class BsaleService {
  private readonly logger = new Logger(BsaleService.name);
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly productIdsArriendo: number[];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('BSALE_BASE_URL')!;
    this.token = this.configService.get<string>('BSALE_API_KEY')!;

    // Leer IDs de productos de arriendo desde .env
    const productIdsString = this.configService.get<string>('BSALE_PRODUCT_IDS_ARRIENDO', '');
    this.productIdsArriendo = productIdsString
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id));

    if (!this.baseUrl || !this.token) {
      this.logger.warn('⚠️  Credenciales de Bsale no configuradas');
    } else {
      this.logger.log(`✅ Bsale Service inicializado`);
      this.logger.debug(`🔍 Base URL: ${this.baseUrl}`);
      this.logger.debug(`🔍 Token: ${this.token.substring(0, 10)}...`);
    }
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
   * Filtra por los product_ids configurados en BSALE_PRODUCT_IDS_ARRIENDO
   * NOTA: Solo trae info básica (SKU, nombre, descripción, barcode)
   * Stock y precios se agregarán después cuando tengamos los endpoints
   */
  async getAllVariantsArriendo(): Promise<any[]> {
    try {
      if (this.productIdsArriendo.length === 0) {
        this.logger.warn('⚠️  No hay product IDs configurados. Retornando array vacío.');
        return [];
      }

      const allVariants: any[] = [];

      this.logger.log(`📦 Obteniendo variantes de productos: [${this.productIdsArriendo.join(', ')}]`);

      // Iterar sobre cada product_id configurado
      for (const productId of this.productIdsArriendo) {
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
            allVariants.push(...variants);
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
   * @param data Datos de la variante a crear
   */
  async createVariant(data: {
    sku: string;
    nombre: string;
    descripcion?: string;
    barcode?: string;
  }): Promise<any> {
    try {
      if (this.productIdsArriendo.length === 0) {
        throw new BadGatewayException('No hay product IDs configurados para arriendo');
      }

      // Usar el primer productId de la lista (o podrías parametrizarlo)
      const productId = this.productIdsArriendo[0];

      this.logger.log(`📤 Creando variante ${data.sku} en Bsale (producto ${productId})...`);

      const payload: any = {
        productId: productId,
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
}
