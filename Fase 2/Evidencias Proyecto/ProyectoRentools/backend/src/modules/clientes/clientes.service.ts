import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateClienteDto, UpdateClienteDto, SearchClienteDto } from './dto/index';
import { InjectRepository } from '@nestjs/typeorm';
import { Cliente } from './entities/cliente.entity';
import { Repository } from 'typeorm';
import { RutValidator } from 'src/common/utils/rut.validator';
import { DatabaseErrorHandler } from 'src/common/utils/database-errors.handler';
import { TipoCliente } from './enums/tipo-cliente.enums';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
  ) {}

async create(dto: CreateClienteDto): Promise<Cliente> {
  try {
    if (!RutValidator.validate(dto.rut)) {
      throw new BadRequestException(
        `El RUT '${dto.rut}' no es válido. Verifica el dígito verificador.`,
      );
    }

    const rutFormateado = RutValidator.formatSimple(dto.rut);

    const existingCliente = await this.clienteRepository.findOne({
      where: { rut: rutFormateado },
    });

    if (existingCliente) {
      throw new ConflictException(
        `Ya existe un cliente con el RUT ${RutValidator.format(rutFormateado)}`,
      );
    }

    if (dto.id_bsale) {
      const existingBsale = await this.clienteRepository.findOne({
        where: { id_bsale: dto.id_bsale },
      });

      if (existingBsale) {
        throw new ConflictException(
          `Ya existe un cliente con el ID de Bsale ${dto.id_bsale}`,
        );
      }
    }

    const nuevoCliente: Partial<Cliente> = {
      rut: rutFormateado,
      tipo_cliente: dto.tipo_cliente,
      email: dto.email,
      telefono: dto.telefono,
      direccion: dto.direccion,
      ciudad: dto.ciudad,
      comuna: dto.comuna,
      id_bsale: dto.id_bsale || undefined,
      fecha_sincronizacion: dto.id_bsale ? new Date() : undefined,
    };

    // Asignar campos según tipo
    if (dto.tipo_cliente === TipoCliente.PERSONA_NATURAL) {
      nuevoCliente.nombre = dto.nombre;
      nuevoCliente.apellido = dto.apellido;
    } else {
      nuevoCliente.razon_social = dto.razon_social;
      nuevoCliente.nombre_fantasia = dto.nombre_fantasia;
      nuevoCliente.giro = dto.giro;
    }

    const cliente = this.clienteRepository.create(nuevoCliente);
    return await this.clienteRepository.save(cliente);

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
        .orderBy('cliente.fecha_creacion', 'DESC')
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

      Object.assign(cliente, {
        ...dto,
        email: dto.email ? dto.email.toLowerCase() : cliente.email,
      });

      return await this.clienteRepository.save(cliente);

    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'cliente');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const cliente = await this.findById(id);
      await this.clienteRepository.remove(cliente);
    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'cliente');
    }
  }

  async softDelete(id: number): Promise<Cliente> {
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
        order: { fecha_creacion: 'DESC' },
        take: limit,
      });
    } catch (error) {
      DatabaseErrorHandler.handle(error, 'clientes');
    }
  }
}