import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GarantiaPago } from './entities/garantia-pago.entity';
import { GarantiaDevolucion } from './entities/garantia-devolucion.entity';
import { Contrato } from '../contratos/entities/contrato.entity';
import { DetalleContrato } from '../contratos/entities/detalle-contrato.entity';
import { DevolucionHerramienta } from '../devoluciones/entities/devolucion-herramienta.entity';
import {
  CreateGarantiaPagoDto,
  UpdateGarantiaPagoDto,
  SearchGarantiaPagoDto,
  CreateGarantiaDevolucionDto,
  UpdateGarantiaDevolucionDto,
  SearchGarantiaDevolucionDto,
} from './dto';
import { DatabaseErrorHandler } from '../../common/utils/database-errors.handler';
import { parseLocalDate } from '../../common/utils/date.helper';
import { EstadoContrato } from '../contratos/enums/estado-contrato.enum';
import { EstadoDevolucion } from '../devoluciones/enums/estado-devolucion.enum';
import {
  PORCENTAJE_DEVOLUCION,
  RAZONES_DEVOLUCION,
} from './garantias.constants';

@Injectable()
export class GarantiasService {
  private readonly logger = new Logger(GarantiasService.name);

  constructor(
    @InjectRepository(GarantiaPago)
    private readonly garantiaPagoRepository: Repository<GarantiaPago>,
    @InjectRepository(GarantiaDevolucion)
    private readonly garantiaDevolucionRepository: Repository<GarantiaDevolucion>,
    @InjectRepository(Contrato)
    private readonly contratoRepository: Repository<Contrato>,
    @InjectRepository(DetalleContrato)
    private readonly detalleContratoRepository: Repository<DetalleContrato>,
    @InjectRepository(DevolucionHerramienta)
    private readonly devolucionHerramientaRepository: Repository<DevolucionHerramienta>,
  ) {}

  // ==================== GARANTÍA PAGO ====================

  /**
   * Crea un pago de garantía para un contrato
   * Validaciones:
   * - Contrato existe y está activo
   * - NO existe otra garantía para ese contrato
   * - monto > 0
   * - monto = contrato.monto_garantia
   */
  async createPago(
    createDto: CreateGarantiaPagoDto,
  ): Promise<GarantiaPago> {
    this.logger.log(
      `💰 Procesando pago de garantía para contrato #${createDto.id_contrato}`,
    );

    try {
      // 1. Validar que el contrato existe y está activo
      const contrato = await this.contratoRepository.findOne({
        where: { id_contrato: createDto.id_contrato },
      });

      if (!contrato) {
        throw new NotFoundException(
          `Contrato #${createDto.id_contrato} no encontrado`,
        );
      }

      if (!contrato.estaActivo()) {
        throw new BadRequestException(
          `Contrato #${createDto.id_contrato} no está activo`,
        );
      }

      // 2. Validar que NO existe otra garantía para este contrato
      const garantiaExistente = await this.garantiaPagoRepository.findOne({
        where: { id_contrato: createDto.id_contrato },
      });

      if (garantiaExistente) {
        throw new ConflictException(
          `Ya existe una garantía pagada para el contrato #${createDto.id_contrato}`,
        );
      }

      // 3. Validar monto
      if (createDto.monto <= 0) {
        throw new BadRequestException('El monto debe ser mayor a 0');
      }

      if (createDto.monto !== contrato.monto_garantia) {
        throw new BadRequestException(
          `El monto de la garantía (${createDto.monto}) debe coincidir con el monto del contrato (${contrato.monto_garantia})`,
        );
      }

      // 4. Parsear fecha
      const fechaPago = parseLocalDate(createDto.fecha_pago);

      // 5. Crear garantía pago
      const garantiaPago = this.garantiaPagoRepository.create({
        id_contrato: createDto.id_contrato,
        fecha_pago: fechaPago,
        monto: createDto.monto,
        metodo_pago: createDto.metodo_pago,
        referencia: createDto.referencia,
      });

      const saved = await this.garantiaPagoRepository.save(garantiaPago);
      this.logger.log(
        `✅ Garantía pago #${saved.id_garantia_pago} creada exitosamente`,
      );

      return this.findOnePago(saved.id_garantia_pago);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`❌ Error al crear pago de garantía: ${error.message}`);
      DatabaseErrorHandler.handle(error, 'garantia_pago');
    }
  }

  /**
   * Busca todas las garantías pago con filtros y paginación
   */
  async findAllPagos(searchDto: SearchGarantiaPagoDto) {
    try {
      const {
        page = 1,
        limit = 10,
        id_contrato,
        metodo_pago,
        fecha_desde,
        fecha_hasta,
      } = searchDto;

      const queryBuilder = this.garantiaPagoRepository
        .createQueryBuilder('gp')
        .leftJoinAndSelect('gp.contrato', 'contrato')
        .leftJoinAndSelect('contrato.cliente', 'cliente');

      // Filtros
      if (id_contrato) {
        queryBuilder.andWhere('gp.id_contrato = :id_contrato', {
          id_contrato,
        });
      }

      if (metodo_pago) {
        queryBuilder.andWhere('gp.metodo_pago = :metodo_pago', {
          metodo_pago,
        });
      }

      if (fecha_desde && fecha_hasta) {
        queryBuilder.andWhere(
          'gp.fecha_pago BETWEEN :fecha_desde AND :fecha_hasta',
          { fecha_desde, fecha_hasta },
        );
      }

      // Paginación
      const offset = searchDto.getOffset();
      queryBuilder.skip(offset).take(limit);

      // Orden
      queryBuilder.orderBy('gp.fecha_pago', 'DESC');

      // Ejecutar
      const [data, total] = await queryBuilder.getManyAndCount();

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`❌ Error al buscar pagos de garantía: ${error.message}`);
      DatabaseErrorHandler.handle(error, 'garantia_pago');
    }
  }

  /**
   * Busca una garantía pago por ID
   */
  async findOnePago(id: number): Promise<GarantiaPago> {
    try {
      const garantiaPago = await this.garantiaPagoRepository.findOne({
        where: { id_garantia_pago: id },
        relations: ['contrato', 'contrato.cliente'],
      });

      if (!garantiaPago) {
        throw new NotFoundException(`Garantía pago #${id} no encontrada`);
      }

      return garantiaPago;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `❌ Error al buscar garantía pago #${id}: ${error.message}`,
      );
      DatabaseErrorHandler.handle(error, 'garantia_pago');
    }
  }

  /**
   * Busca la garantía pago de un contrato
   */
  async findPagoByContrato(id_contrato: number): Promise<GarantiaPago | null> {
    try {
      const garantiaPago = await this.garantiaPagoRepository.findOne({
        where: { id_contrato },
        relations: ['contrato', 'contrato.cliente'],
      });

      return garantiaPago;
    } catch (error) {
      this.logger.error(
        `❌ Error al buscar garantía pago del contrato #${id_contrato}: ${error.message}`,
      );
      DatabaseErrorHandler.handle(error, 'garantia_pago');
    }
  }

  /**
   * Verifica si un contrato tiene garantía pagada
   */
  async verificarGarantiaPagada(id_contrato: number): Promise<boolean> {
    try {
      const garantiaPago = await this.findPagoByContrato(id_contrato);
      return !!garantiaPago;
    } catch (error) {
      this.logger.error(
        `❌ Error al verificar garantía pagada: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Actualiza una garantía pago (solo campos seguros)
   */
  async updatePago(
    id: number,
    updateDto: UpdateGarantiaPagoDto,
  ): Promise<GarantiaPago> {
    try {
      const garantiaPago = await this.findOnePago(id);

      if (updateDto.referencia !== undefined) {
        garantiaPago.referencia = updateDto.referencia;
      }

      await this.garantiaPagoRepository.save(garantiaPago);
      this.logger.log(`✅ Garantía pago #${id} actualizada`);

      return this.findOnePago(id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `❌ Error al actualizar garantía pago #${id}: ${error.message}`,
      );
      DatabaseErrorHandler.handle(error, 'garantia_pago');
    }
  }

  /**
   * Elimina una garantía pago
   */
  async deletePago(id: number): Promise<void> {
    try {
      const garantiaPago = await this.findOnePago(id);

      // Validar que no tenga devolución asociada
      const devolucion = await this.garantiaDevolucionRepository.findOne({
        where: { id_contrato: garantiaPago.id_contrato },
      });

      if (devolucion) {
        throw new BadRequestException(
          'No se puede eliminar una garantía que ya tiene devolución registrada',
        );
      }

      await this.garantiaPagoRepository.remove(garantiaPago);
      this.logger.log(`✅ Garantía pago #${id} eliminada`);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `❌ Error al eliminar garantía pago #${id}: ${error.message}`,
      );
      DatabaseErrorHandler.handle(error, 'garantia_pago');
    }
  }

  // ==================== GARANTÍA DEVOLUCIÓN ====================

  /**
   * Calcula el monto sugerido de devolución basado en el estado de las herramientas
   */
  async calcularMontoDevolucion(id_contrato: number): Promise<{
    monto_sugerido: number;
    razon: string;
    detalle: any[];
  }> {
    this.logger.log(
      `🧮 Calculando monto de devolución para contrato #${id_contrato}`,
    );

    try {
      // 1. Obtener garantía pagada
      const garantiaPago = await this.findPagoByContrato(id_contrato);
      if (!garantiaPago) {
        throw new NotFoundException(
          `No se encontró garantía pagada para el contrato #${id_contrato}`,
        );
      }

      // 2. Obtener contrato con detalles
      const contrato = await this.contratoRepository.findOne({
        where: { id_contrato },
        relations: ['detalles', 'detalles.herramienta'],
      });

      if (!contrato) {
        throw new NotFoundException(`Contrato #${id_contrato} no encontrado`);
      }

      // 3. Calcular total de herramientas en el contrato
      const totalHerramientas = contrato.detalles.reduce(
        (sum, detalle) => sum + detalle.cantidad,
        0,
      );

      // 4. Obtener todas las devoluciones de herramientas
      const devoluciones = await this.devolucionHerramientaRepository.find({
        where: {
          id_detalle: In(contrato.detalles.map((d) => d.id_detalle)),
        },
        relations: ['detalle', 'detalle.herramienta'],
      });

      // 5. Calcular total devuelto
      const totalDevuelto = devoluciones.reduce(
        (sum, dev) => sum + dev.cantidad_devuelta,
        0,
      );

      // 6. Verificar si devolvió todo
      if (totalDevuelto < totalHerramientas) {
        return {
          monto_sugerido: 0,
          razon: RAZONES_DEVOLUCION.NO_DEVUELTAS,
          detalle: devoluciones.map((d) => ({
            herramienta: d.detalle.herramienta.nombre,
            cantidad_devuelta: d.cantidad_devuelta,
            estado: d.estado,
            observaciones: d.observaciones,
          })),
        };
      }

      // 7. Verificar estado de herramientas
      const hayDanadas = devoluciones.some(
        (d) => d.estado === EstadoDevolucion.DANADA,
      );
      const hayReparacionMenor = devoluciones.some(
        (d) => d.estado === EstadoDevolucion.REPARACION_MENOR,
      );

      let porcentaje = PORCENTAJE_DEVOLUCION.BUEN_ESTADO; // 100%
      let razon = RAZONES_DEVOLUCION.TODAS_BUEN_ESTADO;

      if (hayDanadas) {
        porcentaje = PORCENTAJE_DEVOLUCION.DANADA; // 50%
        razon = RAZONES_DEVOLUCION.DANADAS;
      } else if (hayReparacionMenor) {
        porcentaje = PORCENTAJE_DEVOLUCION.REPARACION_MENOR; // 75%
        razon = RAZONES_DEVOLUCION.REPARACION_MENOR;
      }

      const montoSugerido = Math.floor(garantiaPago.monto * porcentaje);

      this.logger.log(
        `✅ Monto calculado: $${montoSugerido} (${porcentaje * 100}%)`,
      );

      return {
        monto_sugerido: montoSugerido,
        razon,
        detalle: devoluciones.map((d) => ({
          herramienta: d.detalle.herramienta.nombre,
          cantidad_devuelta: d.cantidad_devuelta,
          estado: d.estado,
          observaciones: d.observaciones,
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `❌ Error al calcular monto de devolución: ${error.message}`,
      );
      DatabaseErrorHandler.handle(error, 'garantia_devolucion');
    }
  }

  /**
   * Crea una devolución de garantía
   * Validaciones:
   * - Contrato existe y está finalizado
   * - Existe garantía pago previa
   * - NO existe otra devolución
   * - monto_devuelto >= 0
   * - monto_devuelto <= garantia_pago.monto
   */
  async createDevolucion(
    createDto: CreateGarantiaDevolucionDto,
  ): Promise<GarantiaDevolucion> {
    this.logger.log(
      `💸 Procesando devolución de garantía para contrato #${createDto.id_contrato}`,
    );

    try {
      // 1. Validar que el contrato existe
      const contrato = await this.contratoRepository.findOne({
        where: { id_contrato: createDto.id_contrato },
      });

      if (!contrato) {
        throw new NotFoundException(
          `Contrato #${createDto.id_contrato} no encontrado`,
        );
      }

      // 2. Validar que el contrato está finalizado
      if (contrato.estado !== EstadoContrato.FINALIZADO) {
        throw new BadRequestException(
          `El contrato #${createDto.id_contrato} debe estar finalizado para devolver la garantía`,
        );
      }

      // 3. Validar que existe garantía pago previa
      const garantiaPago = await this.findPagoByContrato(
        createDto.id_contrato,
      );
      if (!garantiaPago) {
        throw new NotFoundException(
          `No existe garantía pagada para el contrato #${createDto.id_contrato}`,
        );
      }

      // 4. Validar que NO existe otra devolución
      const devolucionExistente =
        await this.garantiaDevolucionRepository.findOne({
          where: { id_contrato: createDto.id_contrato },
        });

      if (devolucionExistente) {
        throw new ConflictException(
          `Ya existe una devolución de garantía para el contrato #${createDto.id_contrato}`,
        );
      }

      // 5. Calcular monto si no se envió
      let montoDevuelto = createDto.monto_devuelto;
      if (montoDevuelto === undefined || montoDevuelto === null) {
        const calculo = await this.calcularMontoDevolucion(
          createDto.id_contrato,
        );
        montoDevuelto = calculo.monto_sugerido;
        this.logger.log(
          `💡 Monto calculado automáticamente: $${montoDevuelto}`,
        );
      }

      // 6. Validar monto
      if (montoDevuelto < 0) {
        throw new BadRequestException(
          'El monto devuelto no puede ser negativo',
        );
      }

      if (montoDevuelto > garantiaPago.monto) {
        throw new BadRequestException(
          `El monto devuelto ($${montoDevuelto}) no puede ser mayor al monto pagado ($${garantiaPago.monto})`,
        );
      }

      // 7. Parsear fecha
      const fechaDevolucion = parseLocalDate(createDto.fecha_devolucion);

      // 8. Crear devolución
      const garantiaDevolucion = this.garantiaDevolucionRepository.create({
        id_contrato: createDto.id_contrato,
        fecha_devolucion: fechaDevolucion,
        monto_devuelto: montoDevuelto,
        metodo_devolucion: createDto.metodo_devolucion,
        referencia: createDto.referencia,
        observaciones: createDto.observaciones,
      });

      const saved = await this.garantiaDevolucionRepository.save(
        garantiaDevolucion,
      );
      this.logger.log(
        `✅ Devolución de garantía #${saved.id_devolucion_garantia} creada exitosamente`,
      );

      return this.findOneDevolucion(saved.id_devolucion_garantia);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `❌ Error al crear devolución de garantía: ${error.message}`,
      );
      DatabaseErrorHandler.handle(error, 'garantia_devolucion');
    }
  }

  /**
   * Busca todas las devoluciones con filtros y paginación
   */
  async findAllDevoluciones(searchDto: SearchGarantiaDevolucionDto) {
    try {
      const {
        page = 1,
        limit = 10,
        id_contrato,
        metodo_devolucion,
        fecha_desde,
        fecha_hasta,
      } = searchDto;

      const queryBuilder = this.garantiaDevolucionRepository
        .createQueryBuilder('gd')
        .leftJoinAndSelect('gd.contrato', 'contrato')
        .leftJoinAndSelect('contrato.cliente', 'cliente');

      // Filtros
      if (id_contrato) {
        queryBuilder.andWhere('gd.id_contrato = :id_contrato', {
          id_contrato,
        });
      }

      if (metodo_devolucion) {
        queryBuilder.andWhere('gd.metodo_devolucion = :metodo_devolucion', {
          metodo_devolucion,
        });
      }

      if (fecha_desde && fecha_hasta) {
        queryBuilder.andWhere(
          'gd.fecha_devolucion BETWEEN :fecha_desde AND :fecha_hasta',
          { fecha_desde, fecha_hasta },
        );
      }

      // Paginación
      const offset = searchDto.getOffset();
      queryBuilder.skip(offset).take(limit);

      // Orden
      queryBuilder.orderBy('gd.fecha_devolucion', 'DESC');

      // Ejecutar
      const [data, total] = await queryBuilder.getManyAndCount();

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        `❌ Error al buscar devoluciones de garantía: ${error.message}`,
      );
      DatabaseErrorHandler.handle(error, 'garantia_devolucion');
    }
  }

  /**
   * Busca una devolución por ID
   */
  async findOneDevolucion(id: number): Promise<GarantiaDevolucion> {
    try {
      const garantiaDevolucion =
        await this.garantiaDevolucionRepository.findOne({
          where: { id_devolucion_garantia: id },
          relations: ['contrato', 'contrato.cliente'],
        });

      if (!garantiaDevolucion) {
        throw new NotFoundException(
          `Devolución de garantía #${id} no encontrada`,
        );
      }

      return garantiaDevolucion;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `❌ Error al buscar devolución de garantía #${id}: ${error.message}`,
      );
      DatabaseErrorHandler.handle(error, 'garantia_devolucion');
    }
  }

  /**
   * Busca la devolución de un contrato
   */
  async findDevolucionByContrato(
    id_contrato: number,
  ): Promise<GarantiaDevolucion | null> {
    try {
      const garantiaDevolucion =
        await this.garantiaDevolucionRepository.findOne({
          where: { id_contrato },
          relations: ['contrato', 'contrato.cliente'],
        });

      return garantiaDevolucion;
    } catch (error) {
      this.logger.error(
        `❌ Error al buscar devolución del contrato #${id_contrato}: ${error.message}`,
      );
      DatabaseErrorHandler.handle(error, 'garantia_devolucion');
    }
  }

  /**
   * Actualiza una devolución (solo campos seguros)
   */
  async updateDevolucion(
    id: number,
    updateDto: UpdateGarantiaDevolucionDto,
  ): Promise<GarantiaDevolucion> {
    try {
      const garantiaDevolucion = await this.findOneDevolucion(id);

      if (updateDto.referencia !== undefined) {
        garantiaDevolucion.referencia = updateDto.referencia;
      }

      if (updateDto.observaciones !== undefined) {
        garantiaDevolucion.observaciones = updateDto.observaciones;
      }

      await this.garantiaDevolucionRepository.save(garantiaDevolucion);
      this.logger.log(`✅ Devolución de garantía #${id} actualizada`);

      return this.findOneDevolucion(id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `❌ Error al actualizar devolución de garantía #${id}: ${error.message}`,
      );
      DatabaseErrorHandler.handle(error, 'garantia_devolucion');
    }
  }

  /**
   * Elimina una devolución
   */
  async deleteDevolucion(id: number): Promise<void> {
    try {
      const garantiaDevolucion = await this.findOneDevolucion(id);

      await this.garantiaDevolucionRepository.remove(garantiaDevolucion);
      this.logger.log(`✅ Devolución de garantía #${id} eliminada`);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `❌ Error al eliminar devolución de garantía #${id}: ${error.message}`,
      );
      DatabaseErrorHandler.handle(error, 'garantia_devolucion');
    }
  }

  // ==================== RESUMEN Y REPORTES ====================

  /**
   * Obtiene resumen completo de garantías de un contrato
   */
  async getResumenContrato(id_contrato: number) {
    this.logger.log(
      `📊 Obteniendo resumen de garantías para contrato #${id_contrato}`,
    );

    try {
      // Validar contrato
      const contrato = await this.contratoRepository.findOne({
        where: { id_contrato },
        relations: ['detalles', 'detalles.herramienta'],
      });

      if (!contrato) {
        throw new NotFoundException(`Contrato #${id_contrato} no encontrado`);
      }

      // Obtener garantía pagada
      const garantiaPagada = await this.findPagoByContrato(id_contrato);

      // Obtener devolución (si existe)
      const garantiaDevuelta = await this.findDevolucionByContrato(
        id_contrato,
      );

      // Obtener estado de herramientas
      const devoluciones = await this.devolucionHerramientaRepository.find({
        where: {
          id_detalle: In(contrato.detalles.map((d) => d.id_detalle)),
        },
        relations: ['detalle', 'detalle.herramienta'],
      });

      const estadoHerramientas = devoluciones.map((d) => ({
        herramienta: d.detalle.herramienta.nombre,
        cantidad_devuelta: d.cantidad_devuelta,
        estado: d.estado,
        observaciones: d.observaciones,
      }));

      // Calcular monto sugerido si no se ha devuelto
      let montoSugerido = 0;
      if (garantiaPagada && !garantiaDevuelta) {
        const calculo = await this.calcularMontoDevolucion(id_contrato);
        montoSugerido = calculo.monto_sugerido;
      }

      // Calcular monto retenido
      const retenido = garantiaPagada && garantiaDevuelta
        ? garantiaPagada.monto - garantiaDevuelta.monto_devuelto
        : 0;

      return {
        garantia_pagada: garantiaPagada
          ? {
              id: garantiaPagada.id_garantia_pago,
              monto: garantiaPagada.monto,
              fecha_pago: garantiaPagada.fecha_pago,
              metodo_pago: garantiaPagada.metodo_pago,
              referencia: garantiaPagada.referencia,
            }
          : null,
        garantia_devuelta: garantiaDevuelta
          ? {
              id: garantiaDevuelta.id_devolucion_garantia,
              monto_devuelto: garantiaDevuelta.monto_devuelto,
              fecha_devolucion: garantiaDevuelta.fecha_devolucion,
              metodo_devolucion: garantiaDevuelta.metodo_devolucion,
              observaciones: garantiaDevuelta.observaciones,
              referencia: garantiaDevuelta.referencia,
            }
          : null,
        estado_herramientas: estadoHerramientas,
        monto_sugerido: montoSugerido,
        retenido: retenido,
        pendiente_devolucion: !!garantiaPagada && !garantiaDevuelta,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `❌ Error al obtener resumen de contrato: ${error.message}`,
      );
      DatabaseErrorHandler.handle(error, 'garantia');
    }
  }

  /**
   * Obtiene información completa para la pantalla de devolución
   */
  async getInfoDevolucion(id_contrato: number) {
    try {
      const garantiaPago = await this.findPagoByContrato(id_contrato);
      const devolucionExistente = await this.findDevolucionByContrato(
        id_contrato,
      );

      let calculoAutomatico: {
        monto_sugerido: number;
        razon: string;
        detalle: any[];
      } | null = null;
      if (garantiaPago && !devolucionExistente) {
        calculoAutomatico = await this.calcularMontoDevolucion(id_contrato);
      }

      return {
        garantia_pagada: garantiaPago,
        ya_devuelta: !!devolucionExistente,
        devolucion: devolucionExistente,
        calculo_automatico: calculoAutomatico,
        puede_devolver: !devolucionExistente,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error al obtener info de devolución: ${error.message}`,
      );
      DatabaseErrorHandler.handle(error, 'garantia');
    }
  }

  /**
   * Obtiene estadísticas generales de garantías
   */
  async getStats() {
    try {
      const totalPagos = await this.garantiaPagoRepository.count();
      const totalDevoluciones =
        await this.garantiaDevolucionRepository.count();

      const sumaPagos = await this.garantiaPagoRepository
        .createQueryBuilder('gp')
        .select('SUM(gp.monto)', 'total')
        .getRawOne();

      const sumaDevoluciones = await this.garantiaDevolucionRepository
        .createQueryBuilder('gd')
        .select('SUM(gd.monto_devuelto)', 'total')
        .getRawOne();

      return {
        total_pagos: totalPagos,
        total_devoluciones: totalDevoluciones,
        pendientes_devolucion: totalPagos - totalDevoluciones,
        suma_pagos: parseInt(sumaPagos.total) || 0,
        suma_devoluciones: parseInt(sumaDevoluciones.total) || 0,
        suma_retenida:
          (parseInt(sumaPagos.total) || 0) -
          (parseInt(sumaDevoluciones.total) || 0),
      };
    } catch (error) {
      this.logger.error(`❌ Error al obtener estadísticas: ${error.message}`);
      DatabaseErrorHandler.handle(error, 'garantia');
    }
  }
}
