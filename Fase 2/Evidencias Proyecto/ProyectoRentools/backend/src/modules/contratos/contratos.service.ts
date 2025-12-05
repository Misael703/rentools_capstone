import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan } from 'typeorm';
import { Contrato } from './entities/contrato.entity';
import { DetalleContrato } from './entities/detalle-contrato.entity';
import { CreateContratoDto, UpdateContratoDto, SearchContratoDto } from './dto';
import { DatabaseErrorHandler } from '../../common/utils/database-errors.handler';
import { parseLocalDate } from '../../common/utils/date.helper';
import { HerramientasService } from '../herramientas/herramientas.service';
import { ClientesService } from '../clientes/clientes.service';
import { UsuarioService } from '../usuario/usuario.service';
import { EstadoContrato } from './enums/estado-contrato.enum';

@Injectable()
export class ContratosService {
  private readonly logger = new Logger(ContratosService.name);

  constructor(
    @InjectRepository(Contrato)
    private readonly contratoRepository: Repository<Contrato>,
    @InjectRepository(DetalleContrato)
    private readonly detalleContratoRepository: Repository<DetalleContrato>,
    private readonly dataSource: DataSource,
    private readonly herramientasService: HerramientasService,
    private readonly clientesService: ClientesService,
    private readonly usuarioService: UsuarioService,
  ) {}

  /**
   * Crea un nuevo contrato con sus detalles
   * Valida disponibilidad, descuenta stock y guarda snapshots
   */
  async create(
    createContratoDto: CreateContratoDto,
    id_usuario: number,
  ): Promise<Contrato> {
    this.logger.log(
      `📝 Creando contrato para cliente ${createContratoDto.id_cliente}`,
    );

    // Validar fechas (parsear como fecha local para evitar problemas de zona horaria)
    const fechaInicio = parseLocalDate(createContratoDto.fecha_inicio);
    const fechaTermino = parseLocalDate(createContratoDto.fecha_termino_estimada);

    if (fechaTermino <= fechaInicio) {
      throw new BadRequestException(
        'La fecha de término debe ser posterior a la fecha de inicio',
      );
    }

    // Validar que el cliente existe y está activo
    const cliente = await this.clientesService.findById(
      createContratoDto.id_cliente,
    );
    if (!cliente.activo) {
      throw new BadRequestException('El cliente no está activo');
    }

    // Validar que el usuario existe y está activo
    const usuario = await this.usuarioService.findById(id_usuario);
    if (!usuario.activo) {
      throw new BadRequestException('El usuario no está activo');
    }

    // Validar herramientas y calcular monto estimado y garantía
    let montoEstimado = 0;
    let montoGarantia = 0;
    const detallesData: Array<{
      id_herramienta: number;
      nombre_herramienta: string;
      sku_herramienta: string;
      cantidad: number;
      precio_unitario: number;
      dias_arriendo: number;
      subtotal: number;
    }> = [];

    for (const detalle of createContratoDto.detalles) {
      const herramienta = await this.herramientasService.findOne(
        detalle.id_herramienta,
      );

      // Validar que la herramienta está activa
      if (!herramienta.activo) {
        throw new BadRequestException(
          `La herramienta ${herramienta.nombre} no está activa`,
        );
      }

      // Validar días mínimos
      if (detalle.dias_arriendo < herramienta.dias_minimo) {
        throw new BadRequestException(
          `La herramienta ${herramienta.nombre} requiere un mínimo de ${herramienta.dias_minimo} días de arriendo`,
        );
      }

      // Validar stock disponible
      if (!herramienta.estaDisponible(detalle.cantidad)) {
        throw new BadRequestException(
          `Stock insuficiente para ${herramienta.nombre}. Disponible: ${herramienta.stock}, Solicitado: ${detalle.cantidad}`,
        );
      }

      // Calcular subtotal del arriendo
      const subtotal =
        detalle.cantidad * herramienta.precio_diario * detalle.dias_arriendo;
      montoEstimado += subtotal;

      // Calcular garantía total (garantía × cantidad de herramientas)
      montoGarantia += herramienta.garantia * detalle.cantidad;

      // Guardar datos para crear detalle
      detallesData.push({
        id_herramienta: herramienta.id_herramienta,
        nombre_herramienta: herramienta.nombre,
        sku_herramienta: herramienta.sku_bsale,
        cantidad: detalle.cantidad,
        precio_unitario: herramienta.precio_diario,
        dias_arriendo: detalle.dias_arriendo,
        subtotal,
      });
    }

    // Crear contrato con transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear el contrato
      const contrato = this.contratoRepository.create({
        id_cliente: createContratoDto.id_cliente,
        id_usuario,
        fecha_inicio: fechaInicio,
        fecha_termino_estimada: fechaTermino,
        tipo_entrega: createContratoDto.tipo_entrega,
        monto_estimado: montoEstimado,
        monto_garantia: montoGarantia,
        observaciones: createContratoDto.observaciones,
        estado: EstadoContrato.ACTIVO,
      });

      const contratoGuardado = await queryRunner.manager.save(contrato);

      // Crear los detalles
      for (const detalleData of detallesData) {
        const detalle = this.detalleContratoRepository.create({
          ...detalleData,
          id_contrato: contratoGuardado.id_contrato,
        });
        await queryRunner.manager.save(detalle);

        // Descontar stock de la herramienta
        await queryRunner.manager.decrement(
          'herramientas',
          { id_herramienta: detalleData.id_herramienta },
          'stock',
          detalleData.cantidad,
        );
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `✅ Contrato #${contratoGuardado.id_contrato} creado exitosamente. Monto: $${montoEstimado}, Garantía: $${montoGarantia}`,
      );

      // Retornar el contrato con sus relaciones
      return this.findOne(contratoGuardado.id_contrato);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`❌ Error creando contrato: ${error.message}`);
      DatabaseErrorHandler.handle(error, 'contrato');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Busca contratos con filtros y paginación
   */
  async findAll(searchDto: SearchContratoDto) {
    try {
      const {
        page = 1,
        limit = 10,
        id_cliente,
        id_usuario,
        estado,
        tipo_entrega,
        fecha_inicio,
        fecha_termino_estimada,
        fecha_inicio_desde,
        fecha_inicio_hasta,
      } = searchDto;

      const queryBuilder = this.contratoRepository
        .createQueryBuilder('contrato')
        .leftJoinAndSelect('contrato.cliente', 'cliente')
        .leftJoinAndSelect('contrato.usuario', 'usuario')
        .leftJoinAndSelect('contrato.detalles', 'detalles');

      // Aplicar filtros
      if (id_cliente) {
        queryBuilder.andWhere('contrato.id_cliente = :id_cliente', {
          id_cliente,
        });
      }

      if (id_usuario) {
        queryBuilder.andWhere('contrato.id_usuario = :id_usuario', {
          id_usuario,
        });
      }

      if (estado) {
        queryBuilder.andWhere('contrato.estado = :estado', { estado });
      }

      if (tipo_entrega) {
        queryBuilder.andWhere('contrato.tipo_entrega = :tipo_entrega', {
          tipo_entrega,
        });
      }

      if (fecha_inicio) {
        queryBuilder.andWhere('contrato.fecha_inicio = :fecha_inicio', {
          fecha_inicio,
        });
      }

      if (fecha_termino_estimada) {
        queryBuilder.andWhere(
          'contrato.fecha_termino_estimada = :fecha_termino_estimada',
          { fecha_termino_estimada },
        );
      }

      if (fecha_inicio_desde && fecha_inicio_hasta) {
        queryBuilder.andWhere(
          'contrato.fecha_inicio BETWEEN :fecha_inicio_desde AND :fecha_inicio_hasta',
          { fecha_inicio_desde, fecha_inicio_hasta },
        );
      } else if (fecha_inicio_desde) {
        queryBuilder.andWhere(
          'contrato.fecha_inicio >= :fecha_inicio_desde',
          { fecha_inicio_desde },
        );
      } else if (fecha_inicio_hasta) {
        queryBuilder.andWhere(
          'contrato.fecha_inicio <= :fecha_inicio_hasta',
          { fecha_inicio_hasta },
        );
      }

      // Paginación
      const offset = searchDto.getOffset();
      queryBuilder.skip(offset).take(limit);

      // Ordenar por fecha de creación descendente
      queryBuilder.orderBy('contrato.created_at', 'DESC');

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
      this.logger.error(`❌ Error buscando contratos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca un contrato por ID con todas sus relaciones
   */
  async findOne(id: number): Promise<Contrato> {
    try {
      const contrato = await this.contratoRepository.findOne({
        where: { id_contrato: id },
        relations: ['cliente', 'usuario', 'detalles', 'detalles.herramienta'],
      });

      if (!contrato) {
        throw new NotFoundException(`Contrato con ID ${id} no encontrado`);
      }

      return contrato;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `❌ Error buscando contrato #${id}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Busca contratos de un cliente específico
   */
  async findByCliente(id_cliente: number, searchDto: SearchContratoDto) {
    searchDto.id_cliente = id_cliente;
    return this.findAll(searchDto);
  }

  /**
   * Busca contratos de un usuario específico
   */
  async findByUsuario(id_usuario: number, searchDto: SearchContratoDto) {
    searchDto.id_usuario = id_usuario;
    return this.findAll(searchDto);
  }

  /**
   * Actualiza un contrato (solo campos permitidos)
   * Solo se puede actualizar si está activo
   */
  async update(
    id: number,
    updateContratoDto: UpdateContratoDto,
  ): Promise<Contrato> {
    try {
      const contrato = await this.findOne(id);

      if (!contrato.estaActivo()) {
        throw new BadRequestException(
          'Solo se pueden actualizar contratos activos',
        );
      }

      // Actualizar solo campos permitidos
      Object.assign(contrato, updateContratoDto);

      await this.contratoRepository.save(contrato);

      this.logger.log(`✅ Contrato #${id} actualizado exitosamente`);

      return this.findOne(id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`❌ Error actualizando contrato #${id}: ${error.message}`);
      DatabaseErrorHandler.handle(error, 'contrato');
    }
  }

  /**
   * Cancela un contrato y devuelve el stock
   * Solo se puede cancelar si está activo
   */
  async cancelar(id: number): Promise<Contrato> {
    this.logger.log(`🚫 Cancelando contrato #${id}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const contrato = await this.findOne(id);

      if (!contrato.estaActivo()) {
        throw new BadRequestException(
          'Solo se pueden cancelar contratos activos',
        );
      }

      // Devolver stock de todas las herramientas
      for (const detalle of contrato.detalles) {
        await queryRunner.manager.increment(
          'herramientas',
          { id_herramienta: detalle.id_herramienta },
          'stock',
          detalle.cantidad,
        );
      }

      // Cambiar estado a cancelado
      contrato.estado = EstadoContrato.CANCELADO;
      await queryRunner.manager.save(contrato);

      await queryRunner.commitTransaction();

      this.logger.log(`✅ Contrato #${id} cancelado exitosamente`);

      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`❌ Error cancelando contrato #${id}: ${error.message}`);
      DatabaseErrorHandler.handle(error, 'contrato');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Calcula el monto final del contrato (sin devolver stock)
   *
   * IMPORTANTE: Este método NO devuelve stock porque eso es responsabilidad
   * del módulo de Devoluciones. Este método se llama automáticamente cuando
   * el módulo de Devoluciones confirma que se devolvieron TODAS las herramientas.
   *
   * El monto_final puede incluir:
   * - Monto base del contrato (monto_estimado)
   * - Recargos por días extra (calculados en Devoluciones)
   * - Multas por daños (calculados en Devoluciones)
   * - Descuentos especiales (si aplican)
   *
   * Por ahora solo usa monto_estimado, pero el módulo de Devoluciones
   * puede pasar recargos adicionales cuando se implemente.
   */
  async calcularMontoFinal(
    id: number,
    recargosAdicionales: number = 0,
  ): Promise<Contrato> {
    this.logger.log(`🏁 Finalizando contrato #${id}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const contrato = await this.findOne(id);

      if (!contrato.estaActivo()) {
        throw new BadRequestException(
          'Solo se puede finalizar un contrato activo',
        );
      }

      // Calcular monto final
      // monto_estimado + recargos por días extra + multas por daños
      contrato.monto_final = contrato.monto_estimado + recargosAdicionales;
      contrato.estado = EstadoContrato.FINALIZADO;
      contrato.fecha_termino_real = new Date();

      await queryRunner.manager.save(contrato);

      await queryRunner.commitTransaction();

      this.logger.log(
        `✅ Contrato #${id} finalizado. Monto final: $${contrato.monto_final}` +
          (recargosAdicionales > 0
            ? ` (incluye $${recargosAdicionales} en recargos)`
            : ''),
      );

      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `❌ Error finalizando contrato #${id}: ${error.message}`,
      );
      DatabaseErrorHandler.handle(error, 'contrato');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtiene estadísticas de contratos
   */
  async getStats() {
    try {
      const [
        totalContratos,
        activos,
        finalizados,
        vencidos,
        cancelados,
      ] = await Promise.all([
        this.contratoRepository.count(),
        this.contratoRepository.count({
          where: { estado: EstadoContrato.ACTIVO },
        }),
        this.contratoRepository.count({
          where: { estado: EstadoContrato.FINALIZADO },
        }),
        this.contratoRepository.count({
          where: { estado: EstadoContrato.VENCIDO },
        }),
        this.contratoRepository.count({
          where: { estado: EstadoContrato.CANCELADO },
        }),
      ]);

      // Calcular monto total en arriendo (contratos activos)
      const contratosActivos = await this.contratoRepository.find({
        where: { estado: EstadoContrato.ACTIVO },
      });
      const montoTotalEnArriendo = contratosActivos.reduce(
        (sum, c) => sum + c.monto_estimado,
        0,
      );

      // Contratos por mes (últimos 12 meses)
      const fechaInicio = new Date();
      fechaInicio.setMonth(fechaInicio.getMonth() - 12);

      const contratosPorMes = await this.contratoRepository
        .createQueryBuilder('contrato')
        .select("TO_CHAR(contrato.created_at, 'YYYY-MM')", 'mes')
        .addSelect('COUNT(*)', 'cantidad')
        .where('contrato.created_at >= :fechaInicio', { fechaInicio })
        .groupBy("TO_CHAR(contrato.created_at, 'YYYY-MM')")
        .orderBy('mes', 'ASC')
        .getRawMany();

      return {
        totalContratos,
        porEstado: {
          activos,
          finalizados,
          vencidos,
          cancelados,
        },
        montoTotalEnArriendo,
        contratosPorMes,
      };
    } catch (error) {
      this.logger.error(`❌ Error obteniendo estadísticas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene contratos vencidos
   * Contratos con fecha_termino_estimada < HOY y estado = ACTIVO
   */
  async getVencidos() {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const contratosVencidos = await this.contratoRepository.find({
        where: {
          estado: EstadoContrato.ACTIVO,
          fecha_termino_estimada: LessThan(hoy),
        },
        relations: ['cliente', 'usuario', 'detalles'],
        order: {
          fecha_termino_estimada: 'ASC',
        },
      });

      this.logger.log(
        `📊 Se encontraron ${contratosVencidos.length} contratos vencidos`,
      );

      return contratosVencidos;
    } catch (error) {
      this.logger.error(
        `❌ Error obteniendo contratos vencidos: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Marca contratos vencidos (tarea programada)
   * Cambia el estado de ACTIVO a VENCIDO si pasó la fecha
   */
  async marcarVencidos(): Promise<number> {
    try {
      const contratosVencidos = await this.getVencidos();

      let actualizados = 0;
      for (const contrato of contratosVencidos) {
        contrato.estado = EstadoContrato.VENCIDO;
        await this.contratoRepository.save(contrato);
        actualizados++;
      }

      if (actualizados > 0) {
        this.logger.log(
          `✅ ${actualizados} contratos marcados como vencidos`,
        );
      }

      return actualizados;
    } catch (error) {
      this.logger.error(
        `❌ Error marcando contratos vencidos: ${error.message}`,
      );
      throw error;
    }
  }
}
