import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Pago } from './entities/pago.entity';
import { Contrato } from '../contratos/entities/contrato.entity';
import { DevolucionHerramienta } from '../devoluciones/entities/devolucion-herramienta.entity';
import { DetalleContrato } from '../contratos/entities/detalle-contrato.entity';
import { CreatePagoDto, UpdatePagoDto, SearchPagoDto } from './dto';
import { DatabaseErrorHandler } from '../../common/utils/database-errors.handler';

@Injectable()
export class PagosService {
  private readonly logger = new Logger(PagosService.name);

  constructor(
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
    @InjectRepository(Contrato)
    private readonly contratoRepository: Repository<Contrato>,
    @InjectRepository(DevolucionHerramienta)
    private readonly devolucionRepository: Repository<DevolucionHerramienta>,
    @InjectRepository(DetalleContrato)
    private readonly detalleContratoRepository: Repository<DetalleContrato>,
  ) {}

  /**
   * Crea un nuevo pago
   * Valida que el contrato existe y que el monto es válido
   */
  async create(createPagoDto: CreatePagoDto): Promise<Pago> {
    this.logger.log(
      `💰 Procesando pago de $${createPagoDto.monto} para contrato #${createPagoDto.id_contrato}`,
    );

    try {
      // 1. Validar que el contrato existe
      const contrato = await this.contratoRepository.findOne({
        where: { id_contrato: createPagoDto.id_contrato },
      });

      if (!contrato) {
        throw new NotFoundException(
          `Contrato #${createPagoDto.id_contrato} no encontrado`,
        );
      }

      // 2. Validar monto > 0
      if (createPagoDto.monto <= 0) {
        throw new BadRequestException('El monto debe ser mayor a 0');
      }

      // 3. Validar fecha de pago
      const fechaPago = new Date(createPagoDto.fecha_pago);
      const fechaInicio = new Date(contrato.fecha_inicio);

      if (fechaPago < fechaInicio) {
        throw new BadRequestException(
          'La fecha de pago no puede ser anterior a la fecha de inicio del contrato',
        );
      }

      // 4. VALIDAR QUE SOLO SE PAGUE LO QUE YA SE HA DEVUELTO
      // Obtener todos los detalles del contrato
      const detalles = await this.detalleContratoRepository.find({
        where: { id_contrato: createPagoDto.id_contrato },
      });

      // Obtener todas las devoluciones del contrato
      const idsDetalles = detalles.map((d) => d.id_detalle);
      const devoluciones =
        idsDetalles.length > 0
          ? await this.devolucionRepository.find({
              where: { id_detalle: In(idsDetalles) },
            })
          : [];

      // Calcular monto total cobrado hasta ahora (lo que ya se devolvió)
      const montoCobradoHastaAhora = devoluciones.reduce(
        (sum, dev) => sum + dev.monto_cobrado,
        0,
      );

      // Obtener pagos existentes
      const pagosExistentes = await this.pagoRepository.find({
        where: { id_contrato: createPagoDto.id_contrato },
      });

      const totalPagadoHastaAhora = pagosExistentes.reduce(
        (sum, pago) => sum + pago.monto,
        0,
      );

      // Calcular saldo disponible para pagar
      const saldoDisponible = montoCobradoHastaAhora - totalPagadoHastaAhora;

      // Validar que no se pague más de lo devuelto
      if (montoCobradoHastaAhora === 0) {
        throw new BadRequestException(
          'No se puede registrar un pago sin haber devuelto ninguna herramienta. ' +
            'Primero debe devolver las herramientas para calcular el monto a pagar.',
        );
      }

      if (createPagoDto.monto > saldoDisponible) {
        throw new BadRequestException(
          `El monto del pago ($${createPagoDto.monto}) excede el saldo disponible para pagar. ` +
            `Monto cobrado por devoluciones: $${montoCobradoHastaAhora}, ` +
            `Ya pagado: $${totalPagadoHastaAhora}, ` +
            `Saldo disponible: $${saldoDisponible}`,
        );
      }

      this.logger.log(
        `✅ Validación de monto: Cobrado hasta ahora: $${montoCobradoHastaAhora}, ` +
          `Ya pagado: $${totalPagadoHastaAhora}, Saldo disponible: $${saldoDisponible}`,
      );

      // 5. Crear el pago
      const pago = this.pagoRepository.create({
        id_contrato: createPagoDto.id_contrato,
        fecha_pago: fechaPago,
        monto: createPagoDto.monto,
        metodo_pago: createPagoDto.metodo_pago,
        referencia: createPagoDto.referencia,
      });

      const pagoGuardado = await this.pagoRepository.save(pago);

      this.logger.log(
        `✅ Pago #${pagoGuardado.id_pago} registrado. Monto: $${pagoGuardado.monto}, Método: ${pagoGuardado.metodo_pago}`,
      );

      // 6. Verificar si el contrato está pagado completamente
      await this.verificarPagoCompleto(contrato.id_contrato);

      return this.findOne(pagoGuardado.id_pago);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`❌ Error creando pago: ${error.message}`);
      DatabaseErrorHandler.handle(error, 'pago');
    }
  }

  /**
   * Verifica si el contrato está pagado completamente
   * Log informativo, no modifica el contrato
   */
  private async verificarPagoCompleto(id_contrato: number): Promise<void> {
    const contrato = await this.contratoRepository.findOne({
      where: { id_contrato },
    });

    if (!contrato || !contrato.monto_final) {
      return;
    }

    const pagos = await this.pagoRepository.find({
      where: { id_contrato },
    });

    const totalPagado = pagos.reduce((sum, pago) => sum + pago.monto, 0);

    if (totalPagado >= contrato.monto_final) {
      this.logger.log(
        `🎉 Contrato #${id_contrato} pagado completamente. Total pagado: $${totalPagado} / $${contrato.monto_final}`,
      );
    } else {
      const saldoPendiente = contrato.monto_final - totalPagado;
      this.logger.log(
        `📊 Contrato #${id_contrato}: $${totalPagado} pagado de $${contrato.monto_final}. Saldo pendiente: $${saldoPendiente}`,
      );
    }
  }

  /**
   * Busca pagos con filtros y paginación
   */
  async findAll(searchDto: SearchPagoDto) {
    try {
      const {
        page = 1,
        limit = 10,
        id_contrato,
        metodo_pago,
        fecha_pago,
        fecha_desde,
        fecha_hasta,
      } = searchDto;

      const queryBuilder = this.pagoRepository
        .createQueryBuilder('pago')
        .leftJoinAndSelect('pago.contrato', 'contrato')
        .leftJoinAndSelect('contrato.cliente', 'cliente');

      // Aplicar filtros
      if (id_contrato) {
        queryBuilder.andWhere('pago.id_contrato = :id_contrato', {
          id_contrato,
        });
      }

      if (metodo_pago) {
        queryBuilder.andWhere('pago.metodo_pago = :metodo_pago', {
          metodo_pago,
        });
      }

      if (fecha_pago) {
        queryBuilder.andWhere('pago.fecha_pago = :fecha_pago', {
          fecha_pago,
        });
      }

      if (fecha_desde && fecha_hasta) {
        queryBuilder.andWhere('pago.fecha_pago BETWEEN :fecha_desde AND :fecha_hasta', {
          fecha_desde,
          fecha_hasta,
        });
      } else if (fecha_desde) {
        queryBuilder.andWhere('pago.fecha_pago >= :fecha_desde', {
          fecha_desde,
        });
      } else if (fecha_hasta) {
        queryBuilder.andWhere('pago.fecha_pago <= :fecha_hasta', {
          fecha_hasta,
        });
      }

      // Paginación
      const offset = searchDto.getOffset();
      queryBuilder.skip(offset).take(limit);

      // Ordenar por fecha de pago descendente
      queryBuilder.orderBy('pago.fecha_pago', 'DESC');

      // Ejecutar consulta
      const [data, total] = await queryBuilder.getManyAndCount();

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`❌ Error buscando pagos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca un pago por ID con todas sus relaciones
   */
  async findOne(id: number): Promise<Pago> {
    try {
      const pago = await this.pagoRepository.findOne({
        where: { id_pago: id },
        relations: ['contrato', 'contrato.cliente'],
      });

      if (!pago) {
        throw new NotFoundException(`Pago con ID ${id} no encontrado`);
      }

      return pago;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`❌ Error buscando pago #${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca todos los pagos de un contrato específico
   * Calcula el total pagado
   */
  async findByContrato(id_contrato: number): Promise<{
    pagos: Pago[];
    total_pagado: number;
  }> {
    try {
      // Validar que el contrato existe
      const contrato = await this.contratoRepository.findOne({
        where: { id_contrato },
      });

      if (!contrato) {
        throw new NotFoundException(
          `Contrato con ID ${id_contrato} no encontrado`,
        );
      }

      // Obtener todos los pagos del contrato
      const pagos = await this.pagoRepository.find({
        where: { id_contrato },
        order: { fecha_pago: 'DESC' },
      });

      const total_pagado = pagos.reduce((sum, pago) => sum + pago.monto, 0);

      return {
        pagos,
        total_pagado,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `❌ Error buscando pagos del contrato #${id_contrato}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Obtiene un resumen completo de pagos de un contrato
   * Incluye: monto total a pagar, total pagado, saldo pendiente, lista de pagos
   */
  async getResumenContrato(id_contrato: number) {
    try {
      // Validar que el contrato existe
      const contrato = await this.contratoRepository.findOne({
        where: { id_contrato },
        relations: ['cliente'],
      });

      if (!contrato) {
        throw new NotFoundException(
          `Contrato con ID ${id_contrato} no encontrado`,
        );
      }

      // Obtener todos los pagos del contrato
      const pagos = await this.pagoRepository.find({
        where: { id_contrato },
        order: { fecha_pago: 'ASC' },
      });

      // Calcular totales
      const monto_total_pagado = pagos.reduce(
        (sum, pago) => sum + pago.monto,
        0,
      );
      const monto_total_a_pagar = contrato.monto_final || contrato.monto_estimado;
      const saldo_pendiente = monto_total_a_pagar - monto_total_pagado;

      // Determinar estado de pago
      let estado_pago: string;
      if (monto_total_pagado === 0) {
        estado_pago = 'sin_pagos';
      } else if (saldo_pendiente <= 0) {
        estado_pago = 'pagado_completo';
      } else if (monto_total_pagado > 0 && saldo_pendiente > 0) {
        estado_pago = 'pago_parcial';
      } else {
        estado_pago = 'sin_pagos';
      }

      return {
        contrato: {
          id_contrato: contrato.id_contrato,
          estado: contrato.estado,
          monto_final: contrato.monto_final,
          monto_estimado: contrato.monto_estimado,
          cliente: contrato.cliente
            ? {
                id_cliente: contrato.cliente.id_cliente,
                nombre: contrato.cliente.nombre,
                apellido: contrato.cliente.apellido,
                rut: contrato.cliente.rut,
              }
            : null,
        },
        pagos: pagos.map((pago) => ({
          id_pago: pago.id_pago,
          fecha_pago: pago.fecha_pago,
          monto: pago.monto,
          metodo_pago: pago.metodo_pago,
          referencia: pago.referencia,
        })),
        resumen: {
          monto_total_a_pagar,
          monto_total_pagado,
          saldo_pendiente: saldo_pendiente > 0 ? saldo_pendiente : 0,
          estado_pago,
          cantidad_pagos: pagos.length,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `❌ Error obteniendo resumen del contrato #${id_contrato}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Actualiza un pago (solo referencia)
   */
  async update(id: number, updatePagoDto: UpdatePagoDto): Promise<Pago> {
    try {
      const pago = await this.findOne(id);

      // Solo permitir actualizar referencia
      if (updatePagoDto.referencia !== undefined) {
        pago.referencia = updatePagoDto.referencia;
      }

      await this.pagoRepository.save(pago);

      this.logger.log(`✅ Pago #${id} actualizado exitosamente`);

      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`❌ Error actualizando pago #${id}: ${error.message}`);
      DatabaseErrorHandler.handle(error, 'pago');
    }
  }

  /**
   * Elimina un pago (solo si no tiene DTE asociado)
   */
  async delete(id: number): Promise<void> {
    try {
      const pago = await this.findOne(id);

      // Validar que no tiene DTE asociado
      if (pago.id_dte) {
        throw new ConflictException(
          'No se puede eliminar un pago que tiene un DTE asociado',
        );
      }

      await this.pagoRepository.remove(pago);

      this.logger.log(`✅ Pago #${id} eliminado exitosamente`);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`❌ Error eliminando pago #${id}: ${error.message}`);
      DatabaseErrorHandler.handle(error, 'pago');
    }
  }

  /**
   * Obtiene estadísticas de pagos
   * Total recaudado, recaudado por método de pago, recaudado por mes
   */
  async getStats(): Promise<{
    total_recaudado: number;
    cantidad_pagos: number;
    por_metodo_pago: {
      metodo: string;
      total: number;
      cantidad: number;
    }[];
    por_mes: {
      mes: string;
      total: number;
      cantidad: number;
    }[];
  }> {
    try {
      // Obtener todos los pagos
      const pagos = await this.pagoRepository.find();

      // Total recaudado
      const total_recaudado = pagos.reduce((sum, pago) => sum + pago.monto, 0);
      const cantidad_pagos = pagos.length;

      // Recaudado por método de pago
      const porMetodoPago = new Map<string, { total: number; cantidad: number }>();

      pagos.forEach((pago) => {
        const metodo = pago.metodo_pago;
        const actual = porMetodoPago.get(metodo) || { total: 0, cantidad: 0 };
        porMetodoPago.set(metodo, {
          total: actual.total + pago.monto,
          cantidad: actual.cantidad + 1,
        });
      });

      const por_metodo_pago = Array.from(porMetodoPago.entries()).map(
        ([metodo, data]) => ({
          metodo,
          total: data.total,
          cantidad: data.cantidad,
        }),
      );

      // Recaudado por mes
      const porMes = new Map<string, { total: number; cantidad: number }>();

      pagos.forEach((pago) => {
        const fecha = new Date(pago.fecha_pago);
        const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        const actual = porMes.get(mes) || { total: 0, cantidad: 0 };
        porMes.set(mes, {
          total: actual.total + pago.monto,
          cantidad: actual.cantidad + 1,
        });
      });

      // Ordenar por mes (más reciente primero)
      const por_mes = Array.from(porMes.entries())
        .map(([mes, data]) => ({
          mes,
          total: data.total,
          cantidad: data.cantidad,
        }))
        .sort((a, b) => b.mes.localeCompare(a.mes));

      return {
        total_recaudado,
        cantidad_pagos,
        por_metodo_pago,
        por_mes,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error obteniendo estadísticas: ${error.message}`,
      );
      throw error;
    }
  }
}
