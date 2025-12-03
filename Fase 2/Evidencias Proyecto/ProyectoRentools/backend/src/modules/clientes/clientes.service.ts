// src/modules/clientes/clientes.service.ts
import { 
  BadRequestException, 
  ConflictException, 
  Injectable, 
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { CreateClienteDto, UpdateClienteDto, SearchClienteDto, AutocompleteClienteDto } from './dto/index';
import { TipoCliente } from './enums/tipo-cliente.enum';
import { RutValidator } from 'src/common/utils/rut.validator';
import { DatabaseErrorHandler } from 'src/common/utils/database-errors.handler';
import { BsaleService } from '../bsale/bsale.service';

@Injectable()
export class ClientesService {
  private readonly logger = new Logger(ClientesService.name);

  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    private readonly bsaleService: BsaleService,
  ) {}

  /**
   * Crea un cliente: primero busca en Bsale, si no existe lo crea en ambos
   * LÓGICA: Bsale es la fuente de verdad
   */
  async create(dto: CreateClienteDto): Promise<Cliente> {
    try {
      // 1. Validar RUT
      if (!RutValidator.validate(dto.rut)) {
        throw new BadRequestException(
          `El RUT '${dto.rut}' no es válido. Verifica el dígito verificador.`,
        );
      }

      const rutFormateado = RutValidator.formatSimple(dto.rut);

      // 2. Buscar en Bsale PRIMERO (fuente de verdad)
      this.logger.log(`🔍 Buscando cliente ${rutFormateado} en Bsale...`);
      
      const bsaleCliente = await this.bsaleService.findClienteByRut(rutFormateado);

      if (bsaleCliente) {
        // Cliente existe en Bsale
        this.logger.log(`✅ Cliente ${rutFormateado} encontrado en Bsale`);

        // Verificar si ya existe en Rentools
        const existingLocal = await this.clienteRepository.findOne({
          where: { rut: rutFormateado },
        });

        if (existingLocal) {
          throw new ConflictException(
            `El cliente con RUT ${RutValidator.format(rutFormateado)} ya existe en el sistema`
          );
        }

        // Existe en Bsale pero NO en Rentools → Sincronizar
        this.logger.log(`📥 Sincronizando cliente ${rutFormateado} desde Bsale...`);
        return await this.syncClienteFromBsale(bsaleCliente);
      }

      // 3. No existe en Bsale → Crear en ambos sistemas
      this.logger.log(`🆕 Cliente ${rutFormateado} no existe en Bsale. Creando...`);

      // Verificar que tampoco exista localmente
      const existingLocal = await this.clienteRepository.findOne({
        where: { rut: rutFormateado },
      });

      if (existingLocal) {
        throw new ConflictException(
          `El cliente con RUT ${RutValidator.format(rutFormateado)} ya existe localmente`
        );
      }

      // Crear en Bsale primero
      let idBsale: number | null = null;
      try {
        this.logger.log(`📤 Creando cliente ${rutFormateado} en Bsale...`);
        
        const nuevoBsaleCliente = await this.bsaleService.createCliente({
          rut: rutFormateado,
          tipo_cliente: dto.tipo_cliente,
          nombre: dto.nombre,
          apellido: dto.apellido,
          razon_social: dto.razon_social,
          nombre_fantasia: dto.nombre_fantasia,
          giro: dto.giro,
          email: dto.email,
          telefono: dto.telefono,
          direccion: dto.direccion,
          ciudad: dto.ciudad,
          comuna: dto.comuna,
        });

        idBsale = nuevoBsaleCliente.id;
        this.logger.log(`✅ Cliente creado en Bsale con ID ${idBsale}`);

      } catch (error) {
        this.logger.error(`❌ Error creando en Bsale: ${error.message}`);
        throw new BadRequestException(
          'No se pudo crear el cliente en Bsale. Verifica los datos e intenta nuevamente.'
        );
      }

      // Crear en Rentools
      const nuevoCliente: Partial<Cliente> = {
        rut: rutFormateado,
        tipo_cliente: dto.tipo_cliente,
        email: dto.email,
        telefono: dto.telefono,
        direccion: dto.direccion,
        ciudad: dto.ciudad,
        comuna: dto.comuna,
        id_bsale: idBsale,
        fecha_sincronizacion: new Date(),
      };

      if (dto.tipo_cliente === TipoCliente.PERSONA_NATURAL) {
        nuevoCliente.nombre = dto.nombre;
        nuevoCliente.apellido = dto.apellido;
      } else {
        nuevoCliente.razon_social = dto.razon_social;
        nuevoCliente.giro = dto.giro;
      }

      const cliente = this.clienteRepository.create(nuevoCliente);
      const clienteGuardado = await this.clienteRepository.save(cliente);

      this.logger.log(`✅ Cliente ${rutFormateado} creado exitosamente en ambos sistemas`);
      
      return clienteGuardado;

    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'cliente');
    }
  }

  /**
   * NUEVO: Busca o sincroniza un cliente desde Bsale
   */
  async findOrSyncFromBsale(rut: string): Promise<Cliente> {
    try {
      // 1. Validar RUT
      if (!RutValidator.validate(rut)) {
        throw new BadRequestException(`El RUT '${rut}' no es válido`);
      }

      const rutFormateado = RutValidator.formatSimple(rut);

      // 2. Buscar localmente primero (rápido)
      let cliente = await this.clienteRepository.findOne({
        where: { rut: rutFormateado },
      });

      if (cliente) {
        this.logger.log(`✅ Cliente ${rutFormateado} encontrado localmente`);
        return cliente;
      }

      // 3. No existe localmente, buscar en Bsale
      this.logger.log(`🔍 Buscando cliente ${rutFormateado} en Bsale...`);
      
      const bsaleCliente = await this.bsaleService.findClienteByRut(rutFormateado);

      if (!bsaleCliente) {
        throw new NotFoundException(
          `Cliente con RUT ${RutValidator.format(rutFormateado)} no encontrado. ` +
          `Debes crearlo primero en Bsale o en Rentools.`
        );
      }

      // 4. Sincronizar a Rentools
      this.logger.log(`📥 Sincronizando cliente ${rutFormateado} desde Bsale...`);
      
      cliente = await this.syncClienteFromBsale(bsaleCliente);
      
      this.logger.log(`✅ Cliente ${rutFormateado} sincronizado exitosamente`);
      return cliente;

    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'cliente');
    }
  }

  /**
   * NUEVO: Sincroniza un cliente específico desde Bsale
   */
  private async syncClienteFromBsale(bsaleCliente: any): Promise<Cliente> {
    const rutFormateado = RutValidator.formatSimple(bsaleCliente.code);

    // Determinar tipo de cliente según companyOrPerson
    // 0 = persona natural, 1 = empresa
    const tipoCliente = bsaleCliente.companyOrPerson === 1 
      ? TipoCliente.EMPRESA 
      : TipoCliente.PERSONA_NATURAL;

    const clienteData: Partial<Cliente> = {
      rut: rutFormateado,
      tipo_cliente: tipoCliente,
      email: bsaleCliente.email || null,
      telefono: bsaleCliente.phone || null,
      direccion: bsaleCliente.address || null,
      ciudad: bsaleCliente.city || null,
      comuna: bsaleCliente.municipality || null,
      id_bsale: bsaleCliente.id,
      fecha_sincronizacion: new Date(),
    };

    if (tipoCliente === TipoCliente.PERSONA_NATURAL) {
      // Persona natural: firstName = nombre, lastName = apellido
      clienteData.nombre = bsaleCliente.firstName || null;
      clienteData.apellido = bsaleCliente.lastName || null;
    } else {
      // Empresa: company = razón social, activity = giro
      clienteData.razon_social = bsaleCliente.company || null;
      clienteData.giro = bsaleCliente.activity || null;
    }

    const cliente = this.clienteRepository.create(clienteData);
    return await this.clienteRepository.save(cliente);
  }

  /**
   * NUEVO: Sincronización masiva desde Bsale
   */
  async syncAllFromBsale(): Promise<{ 
    sincronizados: number; 
    nuevos: number; 
    errores: number;
    detalles: string[];
  }> {
    this.logger.log('🔄 Iniciando sincronización masiva desde Bsale...');
    
    let sincronizados = 0;
    let nuevos = 0;
    let errores = 0;
    const detalles: string[] = [];

    try {
      const bsaleClientes = await this.bsaleService.getAllClientes();
      this.logger.log(`📥 Obtenidos ${bsaleClientes.length} clientes de Bsale`);

      for (const bsaleCliente of bsaleClientes) {
        try {
          const rutFormateado = RutValidator.formatSimple(bsaleCliente.code);

          // Validar RUT
          if (!RutValidator.validate(rutFormateado)) {
            this.logger.warn(`⚠️  RUT inválido en Bsale: ${bsaleCliente.code}`);
            errores++;
            detalles.push(`RUT inválido: ${bsaleCliente.code}`);
            continue;
          }

          // Buscar si existe localmente
          let cliente = await this.clienteRepository.findOne({
            where: { rut: rutFormateado },
          });

          const tipoCliente = bsaleCliente.companyOrPerson === 1 
            ? TipoCliente.EMPRESA 
            : TipoCliente.PERSONA_NATURAL;

          const clienteData: Partial<Cliente> = {
            rut: rutFormateado,
            tipo_cliente: tipoCliente,
            email: bsaleCliente.email,
            telefono: bsaleCliente.phone,
            direccion: bsaleCliente.address ,
            ciudad: bsaleCliente.city,
            comuna: bsaleCliente.municipality,
            id_bsale: bsaleCliente.id,
            fecha_sincronizacion: new Date(),
          };

          if (tipoCliente === TipoCliente.PERSONA_NATURAL) {
            clienteData.nombre = bsaleCliente.firstName;
            clienteData.apellido = bsaleCliente.lastName;
          } else {
            clienteData.razon_social = bsaleCliente.company;
            clienteData.giro = bsaleCliente.activity;
          }

          if (cliente) {
            // Actualizar existente
            Object.assign(cliente, clienteData);
            await this.clienteRepository.save(cliente);
            sincronizados++;
            detalles.push(`✅ Actualizado: ${rutFormateado}`);
          } else {
            // Crear nuevo
            cliente = this.clienteRepository.create(clienteData);
            await this.clienteRepository.save(cliente);
            nuevos++;
            detalles.push(`🆕 Nuevo: ${rutFormateado}`);
          }

        } catch (error) {
          this.logger.error(`❌ Error procesando ${bsaleCliente.code}:`, error.message);
          errores++;
          detalles.push(`❌ Error: ${bsaleCliente.code} - ${error.message}`);
        }
      }

      this.logger.log(
        `✅ Sincronización completada: ${nuevos} nuevos, ${sincronizados} actualizados, ${errores} errores`
      );

      return { sincronizados, nuevos, errores, detalles };

    } catch (error) {
      this.logger.error('❌ Error en sincronización masiva:', error);
      throw error;
    }
  }

  /**
   * Actualiza un cliente en Rentools Y en Bsale
   */
  async update(id: number, dto: UpdateClienteDto): Promise<Cliente> {
    try {
      const cliente = await this.findById(id);

      if (dto.email && dto.email !== cliente.email) {
        const existingEmail = await this.clienteRepository.findOne({
          where: { email: dto.email.toLowerCase() },
        });

        if (existingEmail && existingEmail.id_cliente !== id) {
          throw new ConflictException(
            `El email '${dto.email}' ya está en uso por otro cliente`
          );
        }
      }

      // Actualizar en Rentools
      Object.assign(cliente, {
        ...dto,
        email: dto.email ? dto.email.toLowerCase() : cliente.email,
      });

      await this.clienteRepository.save(cliente);

      // NUEVO: Actualizar en Bsale si tiene id_bsale
      if (cliente.id_bsale) {
        try {
          this.logger.log(`📤 Actualizando cliente ${cliente.rut} en Bsale...`);
          
          await this.bsaleService.updateCliente(cliente.id_bsale, {
            tipo_cliente: cliente.tipo_cliente,
            nombre: dto.nombre,
            apellido: dto.apellido,
            razon_social: dto.razon_social,
            nombre_fantasia: dto.nombre_fantasia,
            giro: dto.giro,
            email: dto.email,
            telefono: dto.telefono,
            direccion: dto.direccion,
            ciudad: dto.ciudad,
            comuna: dto.comuna,
          });

          // Actualizar fecha de sincronización
          cliente.fecha_sincronizacion = new Date();
          await this.clienteRepository.save(cliente);

          this.logger.log(`✅ Cliente actualizado en Bsale`);

        } catch (error) {
          this.logger.warn(`⚠️  No se pudo actualizar en Bsale: ${error.message}`);
        }
      }

      return cliente;

    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'cliente');
    }
  }


  async findAll(filters?: SearchClienteDto) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const queryBuilder = this.clienteRepository.createQueryBuilder('cliente');

      if (filters?.nombre) {
        queryBuilder.andWhere('cliente.nombre ILIKE :nombre', {
          nombre: `%${filters.nombre}%`,
        });
      }

      if (filters?.rut) {
        const rutLimpio = RutValidator.clean(filters.rut);
        queryBuilder.andWhere('cliente.rut LIKE :rut', {
          rut: `%${rutLimpio}%`,
        });
      }

      if (filters?.email) {
        queryBuilder.andWhere('cliente.email ILIKE :email', {
          email: `%${filters.email}%`,
        });
      }

      if (filters?.telefono) {
        queryBuilder.andWhere('cliente.telefono LIKE :telefono', {
          telefono: `%${filters.telefono}%`,
        });
      }

      if (filters?.activo !== undefined) {
        queryBuilder.andWhere('cliente.activo = :activo', {
          activo: filters.activo,
        });
      }

      const total = await queryBuilder.getCount();

      const data = await queryBuilder
        .orderBy('cliente.created_at', 'DESC')
        .skip(skip)
        .take(limit)
        .getMany();

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      DatabaseErrorHandler.handle(error, 'clientes');
    }
  }

  /**
   * Búsqueda optimizada para autocompletado
   * Busca en: nombre, apellido, nombre completo, razón social y RUT
   * Devuelve resultados formateados listos para mostrar en dropdown
   */
  async autocomplete(filters: AutocompleteClienteDto) {
    try {
      const limit = filters?.limit || 10;
      const query = filters?.query?.trim();

      if (!query || query.length < 3) {
        return [];
      }

      const queryBuilder = this.clienteRepository
        .createQueryBuilder('cliente')
        .select([
          'cliente.id_cliente',
          'cliente.tipo_cliente',
          'cliente.nombre',
          'cliente.apellido',
          'cliente.razon_social',
          'cliente.rut',
          'cliente.email',
          'cliente.telefono',
        ])
        .where('cliente.activo = :activo', { activo: true });

      // Limpiar RUT si parece ser un RUT (contiene números y guión o k)
      const esRut = /[\d-kK]/.test(query);
      const rutLimpio = esRut ? RutValidator.clean(query) : null;

      // Búsqueda OR en múltiples campos
      queryBuilder.andWhere(
        `(
          cliente.nombre ILIKE :query OR
          cliente.apellido ILIKE :query OR
          CONCAT(cliente.nombre, ' ', cliente.apellido) ILIKE :query OR
          cliente.razon_social ILIKE :query OR
          ${rutLimpio ? 'cliente.rut LIKE :rut' : 'FALSE'}
        )`,
        {
          query: `%${query}%`,
          ...(rutLimpio && { rut: `%${rutLimpio}%` }),
        },
      );

      const clientes = await queryBuilder
        .orderBy('cliente.tipo_cliente', 'ASC') // Personas primero, empresas después
        .addOrderBy('cliente.nombre', 'ASC')
        .limit(limit)
        .getMany();

      // Formatear resultados para el frontend
      return clientes.map((cliente) => ({
        id_cliente: cliente.id_cliente,
        tipo_cliente: cliente.tipo_cliente,
        label: this.formatClienteLabel(cliente),
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        razon_social: cliente.razon_social,
        rut: RutValidator.format(cliente.rut),
        email: cliente.email,
        telefono: cliente.telefono,
      }));
    } catch (error) {
      this.logger.error(`Error en autocomplete: ${error.message}`);
      DatabaseErrorHandler.handle(error, 'clientes');
    }
  }

  /**
   * Formatea el label del cliente para mostrar en el dropdown
   * - Persona: "Juan Pérez (12.345.678-9)"
   * - Empresa: "Empresa S.A. (76.123.456-7)"
   */
  private formatClienteLabel(cliente: Cliente): string {
    const rutFormateado = RutValidator.format(cliente.rut);

    if (cliente.tipo_cliente === TipoCliente.PERSONA_NATURAL) {
      const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`.trim();
      return `${nombreCompleto} (${rutFormateado})`;
    } else {
      // Empresa
      const nombre = cliente.razon_social || cliente.nombre;
      return `${nombre} (${rutFormateado})`;
    }
  }

  async findById(id: number): Promise<Cliente> {
    if (!id || isNaN(id) || id <= 0) {
      throw new BadRequestException('ID de cliente inválido');
    }

    try {
      const cliente = await this.clienteRepository.findOne({
        where: { id_cliente: id },
      });

      if (!cliente) {
        throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
      }

      return cliente;
    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'cliente');
    }
  }

  async findByRut(rut: string): Promise<Cliente> {
    try {
      if (!RutValidator.validate(rut)) {
        throw new BadRequestException(`El RUT '${rut}' no es válido`);
      }

      const rutFormateado = RutValidator.formatSimple(rut);

      const cliente = await this.clienteRepository.findOne({
        where: { rut: rutFormateado },
      });

      if (!cliente) {
        throw new NotFoundException(
          `Cliente con RUT ${RutValidator.format(rutFormateado)} no encontrado`,
        );
      }

      return cliente;
    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'cliente');
    }
  }

  async findByEmail(email: string): Promise<Cliente> {
    try {
      const cliente = await this.clienteRepository.findOne({
        where: { email: email.toLowerCase() },
      });
      
      if (!cliente) {
        throw new NotFoundException(
          `Cliente con email '${email}' no encontrado`,
        );
      }

      return cliente;
    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'cliente');
    }
  }

  async remove(id: number): Promise<Cliente> {
    try {
      const cliente = await this.findById(id);
      cliente.activo = false;
      return await this.clienteRepository.save(cliente);
    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'cliente');
    }
  }

  async activate(id: number): Promise<Cliente> {
    try {
      const cliente = await this.findById(id);
      cliente.activo = true;
      return await this.clienteRepository.save(cliente);
    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'cliente');
    }
  }

  async findAllActive(): Promise<Cliente[]> {
    try {
      return await this.clienteRepository.find({
        where: { activo: true },
        order: { nombre: 'ASC' },
      });
    } catch (error) {
      DatabaseErrorHandler.handle(error, 'clientes');
    }
  }

  async count(): Promise<number> {
    try {
      return await this.clienteRepository.count();
    } catch (error) {
      DatabaseErrorHandler.handle(error, 'clientes');
    }
  }

  async countActive(): Promise<number> {
    try {
      return await this.clienteRepository.count({
        where: { activo: true },
      });
    } catch (error) {
      DatabaseErrorHandler.handle(error, 'clientes');
    }
  }

  async existsByRut(rut: string): Promise<boolean> {
    try {
      const rutFormateado = RutValidator.formatSimple(rut);
      const count = await this.clienteRepository.count({
        where: { rut: rutFormateado },
      });
      return count > 0;
    } catch (error) {
      return false;
    }
  }

  async findRecent(limit: number = 10): Promise<Cliente[]> {
    try {
      return await this.clienteRepository.find({
        order: { created_at: 'DESC' },
        take: limit,
      });
    } catch (error) {
      DatabaseErrorHandler.handle(error, 'clientes');
    }
  }
}