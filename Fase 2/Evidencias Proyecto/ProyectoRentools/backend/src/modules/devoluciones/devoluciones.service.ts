import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { DevolucionHerramienta } from './entities/devolucion-herramienta.entity';
import { DetalleContrato } from '../contratos/entities/detalle-contrato.entity';
import { Contrato } from '../contratos/entities/contrato.entity';
import { Pago } from '../pagos/entities/pago.entity';
import {
  CreateDevolucionDto,
  CreateDevolucionMasivaDto,
  UpdateDevolucionDto,
  SearchDevolucionDto,
} from './dto';
import { DatabaseErrorHandler } from '../../common/utils/database-errors.handler';
import { EstadoContrato } from '../contratos/enums/estado-contrato.enum';

@Injectable()
export class DevolucionesService {
  private readonly logger = new Logger(DevolucionesService.name);

  constructor(
    @InjectRepository(DevolucionHerramienta)
    private readonly devolucionRepository: Repository<DevolucionHerramienta>,
    @InjectRepository(DetalleContrato)
    private readonly detalleContratoRepository: Repository<DetalleContrato>,
    @InjectRepository(Contrato)
    private readonly contratoRepository: Repository<Contrato>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Crea una nueva devolución de herramientas
   * Valida disponibilidad, calcula montos, devuelve stock
   * y finaliza el contrato si se devolvió todo
   */
  async create(
    createDevolucionDto: CreateDevolucionDto,
  ): Promise<DevolucionHerramienta> {
    this.logger.log(
      `📦 Procesando devolución de detalle #${createDevolucionDto.id_detalle}`,
    );

    // 1. Validar que el detalle existe
    const detalle = await this.detalleContratoRepository.findOne({
      where: { id_detalle: createDevolucionDto.id_detalle },
      relations: ['contrato', 'herramienta'],
    });

    if (!detalle) {
      throw new NotFoundException(
        `Detalle de contrato #${createDevolucionDto.id_detalle} no encontrado`,
      );
    }

    // 2. Obtener el contrato asociado
    const contrato = detalle.contrato;

    // 3. Validar que el contrato está activo o vencido
    if (
      contrato.estado !== EstadoContrato.ACTIVO &&
      contrato.estado !== EstadoContrato.VENCIDO
    ) {
      throw new BadRequestException(
        `No se puede registrar devolución. El contrato está en estado: ${contrato.estado}`,
      );
    }

    // 4. Validar cantidad devuelta
    if (createDevolucionDto.cantidad_devuelta <= 0) {
      throw new BadRequestException(
        'La cantidad devuelta debe ser mayor a 0',
      );
    }

    // 5. Calcular cantidad ya devuelta previamente
    const devolucionesPrevias = await this.devolucionRepository.find({
      where: { id_detalle: detalle.id_detalle },
    });

    const totalDevueltoPreviamente = devolucionesPrevias.reduce(
      (sum, dev) => sum + dev.cantidad_devuelta,
      0,
    );

    const cantidadPendiente = detalle.cantidad - totalDevueltoPreviamente;

    // 6. Validar que no se devuelva más de lo pendiente
    if (createDevolucionDto.cantidad_devuelta > cantidadPendiente) {
      throw new BadRequestException(
        `No se puede devolver ${createDevolucionDto.cantidad_devuelta} unidades. ` +
          `Cantidad pendiente: ${cantidadPendiente}`,
      );
    }

    // 7. Validar fecha de devolución
    const fechaDevolucion = new Date(createDevolucionDto.fecha_devolucion);
    const fechaInicio = new Date(contrato.fecha_inicio);

    if (fechaDevolucion < fechaInicio) {
      throw new BadRequestException(
        'La fecha de devolución no puede ser anterior a la fecha de inicio del contrato',
      );
    }

    // 8. Calcular días reales
    const diffTime = Math.abs(
      fechaDevolucion.getTime() - fechaInicio.getTime(),
    );
    const diasReales = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 9. Calcular monto cobrado
    const montoCobrado =
      createDevolucionDto.cantidad_devuelta *
      detalle.precio_unitario *
      diasReales;

    // 10. Crear transacción para devolver stock y guardar devolución
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear la devolución
      const devolucion = this.devolucionRepository.create({
        id_detalle: detalle.id_detalle,
        cantidad_devuelta: createDevolucionDto.cantidad_devuelta,
        fecha_devolucion: fechaDevolucion,
        dias_reales: diasReales,
        monto_cobrado: montoCobrado,
        estado: createDevolucionDto.estado,
        observaciones: createDevolucionDto.observaciones,
      });

      const devolucionGuardada = await queryRunner.manager.save(devolucion);

      // Devolver stock a la herramienta
      await queryRunner.manager.increment(
        'herramientas',
        { id_herramienta: detalle.id_herramienta },
        'stock',
        createDevolucionDto.cantidad_devuelta,
      );

      this.logger.log(
        `✅ Devolución #${devolucionGuardada.id_devolucion} registrada. ` +
          `${createDevolucionDto.cantidad_devuelta} unidades devueltas. ` +
          `Monto: $${montoCobrado}`,
      );

      // 11. Verificar si se devolvió TODO el contrato
      await this.verificarYFinalizarContrato(
        contrato.id_contrato,
        queryRunner,
      );

      await queryRunner.commitTransaction();

      return this.findOne(devolucionGuardada.id_devolucion);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`❌ Error creando devolución: ${error.message}`);
      DatabaseErrorHandler.handle(error, 'devolución');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Crea múltiples devoluciones en una sola transacción
   * Perfecto para devoluciones masivas desde el frontend
   */
  async createMasiva(
    createDevolucionMasivaDto: CreateDevolucionMasivaDto,
  ): Promise<{
    devoluciones: DevolucionHerramienta[];
    resumen: {
      total_devoluciones: number;
      total_herramientas_devueltas: number;
      monto_total_cobrado: number;
      contratos_finalizados: number[];
    };
  }> {
    this.logger.log(
      `📦📦📦 Procesando devolución masiva de ${createDevolucionMasivaDto.devoluciones.length} herramientas`,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const devolucionesCreadas: DevolucionHerramienta[] = [];
      const contratosAfectados = new Set<number>();
      let totalHerramientasDevueltas = 0;
      let montoTotalCobrado = 0;

      // Procesar cada devolución
      for (const devolucionDto of createDevolucionMasivaDto.devoluciones) {
        // 1. Validar que el detalle existe
        const detalle = await queryRunner.manager.findOne(DetalleContrato, {
          where: { id_detalle: devolucionDto.id_detalle },
          relations: ['contrato', 'herramienta'],
        });

        if (!detalle) {
          throw new NotFoundException(
            `Detalle de contrato #${devolucionDto.id_detalle} no encontrado`,
          );
        }

        const contrato = detalle.contrato;
        contratosAfectados.add(contrato.id_contrato);

        // 2. Validar que el contrato está activo o vencido
        if (
          contrato.estado !== EstadoContrato.ACTIVO &&
          contrato.estado !== EstadoContrato.VENCIDO
        ) {
          throw new BadRequestException(
            `Detalle #${devolucionDto.id_detalle}: No se puede registrar devolución. ` +
              `El contrato #${contrato.id_contrato} está en estado: ${contrato.estado}`,
          );
        }

        // 3. Validar cantidad devuelta
        if (devolucionDto.cantidad_devuelta <= 0) {
          throw new BadRequestException(
            `Detalle #${devolucionDto.id_detalle}: La cantidad devuelta debe ser mayor a 0`,
          );
        }

        // 4. Calcular cantidad ya devuelta previamente
        const devolucionesPrevias = await queryRunner.manager.find(
          DevolucionHerramienta,
          {
            where: { id_detalle: detalle.id_detalle },
          },
        );

        const totalDevueltoPreviamente = devolucionesPrevias.reduce(
          (sum, dev) => sum + dev.cantidad_devuelta,
          0,
        );

        const cantidadPendiente = detalle.cantidad - totalDevueltoPreviamente;

        // 5. Validar que no se devuelva más de lo pendiente
        if (devolucionDto.cantidad_devuelta > cantidadPendiente) {
          throw new BadRequestException(
            `Detalle #${devolucionDto.id_detalle}: No se puede devolver ${devolucionDto.cantidad_devuelta} unidades. ` +
              `Cantidad pendiente: ${cantidadPendiente}`,
          );
        }

        // 6. Validar fecha de devolución
        const fechaDevolucion = new Date(devolucionDto.fecha_devolucion);
        const fechaInicio = new Date(contrato.fecha_inicio);

        if (fechaDevolucion < fechaInicio) {
          throw new BadRequestException(
            `Detalle #${devolucionDto.id_detalle}: La fecha de devolución no puede ser anterior ` +
              `a la fecha de inicio del contrato`,
          );
        }

        // 7. Calcular días reales
        const diffTime = Math.abs(
          fechaDevolucion.getTime() - fechaInicio.getTime(),
        );
        const diasReales = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // 8. Calcular monto cobrado
        const montoCobrado =
          devolucionDto.cantidad_devuelta *
          detalle.precio_unitario *
          diasReales;

        // 9. Crear la devolución
        const devolucion = queryRunner.manager.create(DevolucionHerramienta, {
          id_detalle: detalle.id_detalle,
          cantidad_devuelta: devolucionDto.cantidad_devuelta,
          fecha_devolucion: fechaDevolucion,
          dias_reales: diasReales,
          monto_cobrado: montoCobrado,
          estado: devolucionDto.estado,
          observaciones: devolucionDto.observaciones,
        });

        const devolucionGuardada = await queryRunner.manager.save(devolucion);
        devolucionesCreadas.push(devolucionGuardada);

        // 10. Devolver stock a la herramienta
        await queryRunner.manager.increment(
          'herramientas',
          { id_herramienta: detalle.id_herramienta },
          'stock',
          devolucionDto.cantidad_devuelta,
        );

        totalHerramientasDevueltas += devolucionDto.cantidad_devuelta;
        montoTotalCobrado += montoCobrado;

        this.logger.log(
          `  ✅ Devolución #${devolucionGuardada.id_devolucion} registrada. ` +
            `${devolucionDto.cantidad_devuelta} ${detalle.nombre_herramienta}. ` +
            `Monto: $${montoCobrado}`,
        );
      }

      // 11. Verificar finalización de contratos afectados
      const contratosFinalizados: number[] = [];
      for (const id_contrato of contratosAfectados) {
        const finalizado = await this.verificarYFinalizarContrato(
          id_contrato,
          queryRunner,
        );
        if (finalizado) {
          contratosFinalizados.push(id_contrato);
        }
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `✅✅✅ Devolución masiva completada. ` +
          `${devolucionesCreadas.length} devoluciones, ` +
          `${totalHerramientasDevueltas} herramientas, ` +
          `Monto total: $${montoTotalCobrado}`,
      );

      // Retornar con todas las relaciones cargadas
      const devolucionesConRelaciones = await Promise.all(
        devolucionesCreadas.map((d) => this.findOne(d.id_devolucion)),
      );

      return {
        devoluciones: devolucionesConRelaciones,
        resumen: {
          total_devoluciones: devolucionesCreadas.length,
          total_herramientas_devueltas: totalHerramientasDevueltas,
          monto_total_cobrado: montoTotalCobrado,
          contratos_finalizados: contratosFinalizados,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `❌ Error en devolución masiva: ${error.message}`,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'devolución masiva');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Verifica si se devolvieron TODAS las herramientas del contrato
   * Si es así, finaliza el contrato automáticamente
   * Retorna true si se finalizó el contrato
   */
  private async verificarYFinalizarContrato(
    id_contrato: number,
    queryRunner: any,
  ): Promise<boolean> {
    // 1. Obtener todos los detalles del contrato
    const detalles = await queryRunner.manager.find(DetalleContrato, {
      where: { id_contrato },
    });

    // 2. Obtener todas las devoluciones del contrato
    const idsDetalles = detalles.map((d) => d.id_detalle);
    const devoluciones = await queryRunner.manager.find(DevolucionHerramienta, {
      where: { id_detalle: In(idsDetalles) },
    });

    // 3. Calcular totales
    const totalContratado = detalles.reduce((sum, d) => sum + d.cantidad, 0);
    const totalDevuelto = devoluciones.reduce(
      (sum, d) => sum + d.cantidad_devuelta,
      0,
    );

    this.logger.log(
      `📊 Contrato #${id_contrato}: ${totalDevuelto}/${totalContratado} herramientas devueltas`,
    );

    // 4. Si se devolvió todo → finalizar contrato
    if (totalContratado === totalDevuelto) {
      const contrato = await queryRunner.manager.findOne(Contrato, {
        where: { id_contrato },
      });

      // Calcular monto final (suma de todos los montos cobrados)
      const montoFinal = devoluciones.reduce(
        (sum, d) => sum + d.monto_cobrado,
        0,
      );

      // INFORMAR SOBRE EL ESTADO DE PAGO (no bloquear la devolución)
      const pagos = await queryRunner.manager.find(Pago, {
        where: { id_contrato },
      });

      const totalPagado = pagos.reduce((sum, p) => sum + p.monto, 0);
      const saldoPendiente = montoFinal - totalPagado;

      if (saldoPendiente > 0) {
        this.logger.warn(
          `⚠️ Contrato #${id_contrato} finalizado con saldo pendiente. ` +
            `Monto total: $${montoFinal}, Pagado: $${totalPagado}, ` +
            `Saldo pendiente: $${saldoPendiente}. ` +
            `El pago completo será requerido para emitir DTE y devolver garantía.`,
        );
      } else {
        this.logger.log(
          `💰 Contrato #${id_contrato} totalmente pagado. Puede proceder a emitir DTE y devolver garantía.`,
        );
      }

      // Obtener la fecha de devolución más reciente
      const fechaTerminoReal = devoluciones.reduce((latest, d) => {
        const fechaDev = new Date(d.fecha_devolucion);
        return fechaDev > latest ? fechaDev : latest;
      }, new Date(0));

      contrato.estado = EstadoContrato.FINALIZADO;
      contrato.fecha_termino_real = fechaTerminoReal;
      contrato.monto_final = montoFinal;

      await queryRunner.manager.save(contrato);

      this.logger.log(
        `🏁 Contrato #${id_contrato} FINALIZADO automáticamente. ` +
          `Monto final: $${montoFinal}`,
      );

      return true;
    }

    return false;
  }

  /**
   * Busca devoluciones con filtros y paginación
   */
  async findAll(searchDto: SearchDevolucionDto) {
    try {
      const {
        page = 1,
        limit = 10,
        id_contrato,
        estado,
        fecha_devolucion,
      } = searchDto;

      const queryBuilder = this.devolucionRepository
        .createQueryBuilder('devolucion')
        .leftJoinAndSelect('devolucion.detalle', 'detalle')
        .leftJoinAndSelect('detalle.contrato', 'contrato')
        .leftJoinAndSelect('detalle.herramienta', 'herramienta');

      // Aplicar filtros
      if (id_contrato) {
        queryBuilder.andWhere('contrato.id_contrato = :id_contrato', {
          id_contrato,
        });
      }

      if (estado) {
        queryBuilder.andWhere('devolucion.estado = :estado', { estado });
      }

      if (fecha_devolucion) {
        queryBuilder.andWhere('devolucion.fecha_devolucion = :fecha_devolucion', {
          fecha_devolucion,
        });
      }

      // Paginación
      const offset = searchDto.getOffset();
      queryBuilder.skip(offset).take(limit);

      // Ordenar por fecha de devolución descendente
      queryBuilder.orderBy('devolucion.fecha_devolucion', 'DESC');

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
      this.logger.error(`❌ Error buscando devoluciones: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca una devolución por ID con todas sus relaciones
   */
  async findOne(id: number): Promise<DevolucionHerramienta> {
    try {
      const devolucion = await this.devolucionRepository.findOne({
        where: { id_devolucion: id },
        relations: [
          'detalle',
          'detalle.contrato',
          'detalle.contrato.cliente',
          'detalle.herramienta',
        ],
      });

      if (!devolucion) {
        throw new NotFoundException(`Devolución con ID ${id} no encontrada`);
      }

      return devolucion;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `❌ Error buscando devolución #${id}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Busca todas las devoluciones de un contrato específico
   */
  async findByContrato(id_contrato: number): Promise<DevolucionHerramienta[]> {
    try {
      // Primero validar que el contrato existe
      const contrato = await this.contratoRepository.findOne({
        where: { id_contrato },
      });

      if (!contrato) {
        throw new NotFoundException(
          `Contrato con ID ${id_contrato} no encontrado`,
        );
      }

      // Obtener todos los detalles del contrato
      const detalles = await this.detalleContratoRepository.find({
        where: { id_contrato },
      });

      if (detalles.length === 0) {
        return [];
      }

      // Obtener devoluciones de esos detalles
      const idsDetalles = detalles.map((d) => d.id_detalle);
      const devoluciones = await this.devolucionRepository.find({
        where: { id_detalle: In(idsDetalles) },
        relations: ['detalle', 'detalle.herramienta'],
        order: { fecha_devolucion: 'DESC' },
      });

      return devoluciones;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `❌ Error buscando devoluciones del contrato #${id_contrato}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Obtiene un resumen completo del estado de devoluciones de un contrato
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

      // Obtener todos los detalles del contrato
      const detalles = await this.detalleContratoRepository.find({
        where: { id_contrato },
        relations: ['herramienta'],
      });

      // Obtener todas las devoluciones del contrato
      const idsDetalles = detalles.map((d) => d.id_detalle);
      const devoluciones =
        idsDetalles.length > 0
          ? await this.devolucionRepository.find({
              where: { id_detalle: In(idsDetalles) },
            })
          : [];

      // Calcular monto total cobrado hasta ahora
      const montoCobradoHastaAhora = devoluciones.reduce(
        (sum, d) => sum + d.monto_cobrado,
        0,
      );

      // Construir resumen por herramienta
      const herramientas = detalles.map((detalle) => {
        // Obtener devoluciones de este detalle
        const devolucionesDetalle = devoluciones.filter(
          (d) => d.id_detalle === detalle.id_detalle,
        );

        const cantidadDevuelta = devolucionesDetalle.reduce(
          (sum, d) => sum + d.cantidad_devuelta,
          0,
        );

        const cantidadPendiente = detalle.cantidad - cantidadDevuelta;

        // Determinar estado de devolución
        let estadoDevolucion = 'pendiente';
        let montoCobrado = 0;

        if (cantidadDevuelta > 0) {
          if (cantidadPendiente === 0) {
            // Todas devueltas - tomar el estado de la última devolución
            const ultimaDevolucion = devolucionesDetalle.sort(
              (a, b) =>
                new Date(b.fecha_devolucion).getTime() -
                new Date(a.fecha_devolucion).getTime(),
            )[0];
            estadoDevolucion = ultimaDevolucion.estado;
          } else {
            // Parcialmente devueltas
            estadoDevolucion = 'parcial';
          }

          // Calcular monto cobrado por este detalle
          montoCobrado = devolucionesDetalle.reduce(
            (sum, d) => sum + d.monto_cobrado,
            0,
          );
        }

        return {
          id_detalle: detalle.id_detalle,
          nombre_herramienta: detalle.nombre_herramienta,
          cantidad_contratada: detalle.cantidad,
          cantidad_devuelta: cantidadDevuelta,
          cantidad_pendiente: cantidadPendiente,
          estado_devolucion: estadoDevolucion,
          monto_cobrado: cantidadDevuelta > 0 ? montoCobrado : undefined,
        };
      });

      // Calcular totales
      const totalHerramientas = detalles.reduce(
        (sum, d) => sum + d.cantidad,
        0,
      );
      const totalDevueltas = devoluciones.reduce(
        (sum, d) => sum + d.cantidad_devuelta,
        0,
      );
      const totalPendientes = totalHerramientas - totalDevueltas;
      const porcentajeDevuelto =
        totalHerramientas > 0
          ? Math.round((totalDevueltas / totalHerramientas) * 100 * 100) / 100
          : 0;

      return {
        contrato: {
          id_contrato: contrato.id_contrato,
          estado: contrato.estado,
          monto_estimado: contrato.monto_estimado,
          monto_cobrado_hasta_ahora: montoCobradoHastaAhora,
        },
        herramientas,
        resumen: {
          total_herramientas: totalHerramientas,
          total_devueltas: totalDevueltas,
          total_pendientes: totalPendientes,
          porcentaje_devuelto: porcentajeDevuelto,
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
   * Actualiza una devolución (solo estado y observaciones)
   */
  async update(
    id: number,
    updateDevolucionDto: UpdateDevolucionDto,
  ): Promise<DevolucionHerramienta> {
    try {
      const devolucion = await this.findOne(id);

      // Solo permitir actualizar estado y observaciones
      if (updateDevolucionDto.estado) {
        devolucion.estado = updateDevolucionDto.estado;
      }

      if (updateDevolucionDto.observaciones !== undefined) {
        devolucion.observaciones = updateDevolucionDto.observaciones;
      }

      await this.devolucionRepository.save(devolucion);

      this.logger.log(`✅ Devolución #${id} actualizada exitosamente`);

      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `❌ Error actualizando devolución #${id}: ${error.message}`,
      );
      DatabaseErrorHandler.handle(error, 'devolución');
    }
  }
}
