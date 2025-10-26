import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Cliente } from './entities/cliente.entity';
import { Repository } from 'typeorm';
import { RutValidator } from 'src/common/utils/rut.validator';
import { DatabaseErrorHandler } from 'src/common/utils/database-errors.handler';

@Injectable()
export class ClientesService {
  clienteRepo: any;

  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {}

async create(dto: CreateClienteDto): Promise<Cliente> {
    try {
      // 1. Validar RUT chileno
      if (!RutValidator.validate(dto.rut)) {
        throw new BadRequestException(
          `El RUT '${dto.rut}' no es válido. Verifica el dígito verificador.`
        );
      }

      // 2. Formatear RUT al formato simple (12345678-9)
      const rutFormateado = RutValidator.formatSimple(dto.rut);

      // 3. Verificar si el RUT ya existe
      const existingCliente = await this.clienteRepo.findOne({
        where: { rut: rutFormateado },
      });

      if (existingCliente) {
        throw new ConflictException(
          `Ya existe un cliente con el RUT ${RutValidator.format(rutFormateado)}`
        );
      }

      // 4. Si viene id_bsale, verificar que no esté duplicado
      if (dto.id_bsale) {
        const existingBsale = await this.clienteRepo.findOne({
          where: { id_bsale: dto.id_bsale },
        });

        if (existingBsale) {
          throw new ConflictException(
            `Ya existe un cliente con el ID de Bsale ${dto.id_bsale}`
          );
        }
      }

      // 5. Crear cliente
      const cliente = this.clienteRepo.create({
        ...dto,
        rut: rutFormateado,
        id_bsale: dto.id_bsale || null,
        fecha_sincronizacion: dto.id_bsale ? new Date() : null,
      });

      // 6. Guardar
      return await this.clienteRepo.save(cliente);

    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'cliente');
    }
  }

}
