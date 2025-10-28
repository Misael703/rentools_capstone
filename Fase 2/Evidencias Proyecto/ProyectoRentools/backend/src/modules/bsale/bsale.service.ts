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

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
        payload.company = 0;
      } else {
        payload.firstName = data.nombre_fantasia || data.razon_social || '';
        payload.lastName = data.razon_social || '';
        payload.activity = data.giro || '';
        payload.company = 1;
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
      } else {
        if (data.nombre_fantasia) payload.firstName = data.nombre_fantasia;
        if (data.razon_social) payload.lastName = data.razon_social;
        if (data.giro) payload.activity = data.giro;
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
