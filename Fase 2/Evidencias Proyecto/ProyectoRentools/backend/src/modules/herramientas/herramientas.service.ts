import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Herramienta } from './entities/herramienta.entity';
import {
  CreateHerramientaDto,
  UpdateHerramientaDto,
  SearchHerramientaDto,
  ImportarHerramientaDto
} from './dto';
import { DatabaseErrorHandler } from 'src/common/utils/database-errors.handler';
import { BsaleService } from '../bsale/bsale.service';

@Injectable()
export class HerramientasService {
  private readonly logger = new Logger(HerramientasService.name);

  constructor(
    @InjectRepository(Herramienta)
    private readonly herramientaRepository: Repository<Herramienta>,
    private readonly bsaleService: BsaleService,
  ) {}

  /**
   * Verifica si un SKU ya existe (local o en Bsale)
   * Usado por el frontend para validación en tiempo real
   * Retorna true si el SKU ya existe, false si está disponible
   */
  async verificarSku(sku: string): Promise<{ existe: boolean }> {
    try {
      // Verificar en base de datos local
      const existeLocal = await this.herramientaRepository.findOne({
        where: { sku_bsale: sku },
      });

      if (existeLocal) {
        return { existe: true };
      }

      // Verificar en Bsale
      const variantEnBsale = await this.bsaleService.findVariantBySku(sku);

      return { existe: !!variantEnBsale };

    } catch (error) {
      this.logger.error(`Error verificando SKU ${sku}:`, error.message);
      throw new BadRequestException(`Error al verificar SKU: ${error.message}`);
    }
  }

  /**
   * Verifica si un código de barras ya existe en Bsale
   * Retorna true si el barcode ya existe, false si está disponible
   */
  async verificarBarcode(barcode: string): Promise<{ existe: boolean; sku?: string }> {
    try {
      if (!barcode || barcode.trim() === '') {
        return { existe: false };
      }

      // Verificar en Bsale
      const variantEnBsale = await this.bsaleService.findVariantByBarcode(barcode);

      if (variantEnBsale) {
        return {
          existe: true,
          sku: variantEnBsale.code
        };
      }

      return { existe: false };

    } catch (error) {
      this.logger.error(`Error verificando barcode ${barcode}:`, error.message);
      throw new BadRequestException(`Error al verificar código de barras: ${error.message}`);
    }
  }

  /**
   * Importa una herramienta existente desde Bsale
   * Requiere que la variante YA exista en Bsale
   * Solo solicita los datos de negocio (precio, garantía, stock)
   */
  async importarDesdeBsale(dto: ImportarHerramientaDto): Promise<Herramienta> {
    try {
      // Verificar que NO exista localmente
      const existeLocal = await this.herramientaRepository.findOne({
        where: { sku_bsale: dto.sku_bsale },
      });

      if (existeLocal) {
        throw new ConflictException(
          `Ya existe una herramienta con el SKU '${dto.sku_bsale}' en el sistema`
        );
      }

      // Buscar en Bsale (debe existir)
      const variantEnBsale = await this.bsaleService.findVariantBySku(dto.sku_bsale);

      if (!variantEnBsale) {
        throw new NotFoundException(
          `No existe una variante con el SKU '${dto.sku_bsale}' en Bsale`
        );
      }

      // Mapear state de Bsale a activo
      const activoSegunBsale = variantEnBsale.state === 0;

      // Sincronizar datos desde Bsale (source of truth para catálogo)
      const datosParaGuardar: Partial<Herramienta> = {
        sku_bsale: variantEnBsale.code,
        id_bsale: variantEnBsale.id,
        nombre: variantEnBsale.description || variantEnBsale.code,
        barcode: variantEnBsale.barCode || null,
        descripcion: variantEnBsale.note || null,
        imagen_url: variantEnBsale.image_url || null,
        activo: activoSegunBsale,
        // Datos de negocio desde el DTO
        precio_diario: dto.precio_diario,
        garantia: dto.garantia ?? 0,
        dias_minimo: dto.dias_minimo ?? 1,
        stock: dto.stock ?? 0,
        fecha_sincronizacion: new Date(),
      };

      const herramienta = this.herramientaRepository.create(datosParaGuardar);
      const saved = await this.herramientaRepository.save(herramienta);

      this.logger.log(`✅ Herramienta importada desde Bsale: ${saved.nombre} (ID Bsale: ${saved.id_bsale})`);

      return saved;

    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'herramienta');
    }
  }

  /**
   * Crea una herramienta manualmente
   * IMPORTANTE: Retorna 409 Conflict con mensaje simple si el SKU ya existe
   * El SKU debe ser único tanto en sistema local como en Bsale
   * Nota: Para sincronización masiva desde Bsale, usar syncAllFromBsale()
   */
  async create(dto: CreateHerramientaDto): Promise<Herramienta> {
    try {
      // Verificar que el SKU no exista localmente
      const existeLocal = await this.herramientaRepository.findOne({
        where: { sku_bsale: dto.sku_bsale },
      });

      if (existeLocal) {
        throw new ConflictException(
          `Ya existe una herramienta con el SKU '${dto.sku_bsale}'`
        );
      }

      // Verificar si ya existe en Bsale por SKU
      const variantEnBsale = await this.bsaleService.findVariantBySku(dto.sku_bsale);

      if (variantEnBsale) {
        throw new ConflictException(
          `Ya existe una herramienta con el SKU '${dto.sku_bsale}'`
        );
      }

      // Verificar si el barcode ya existe en Bsale (si viene barcode)
      if (dto.barcode && dto.barcode.trim() !== '') {
        const variantConBarcode = await this.bsaleService.findVariantByBarcode(dto.barcode);

        if (variantConBarcode) {
          throw new ConflictException(
            `Ya existe una variante en Bsale con el código de barras '${dto.barcode}' (SKU: ${variantConBarcode.code})`
          );
        }
      }

      // No existe en ningún lado, crear nueva variante en Bsale
      this.logger.log(`📤 Creando nueva variante en Bsale: ${dto.sku_bsale}`);

      const nuevaVariante = await this.bsaleService.createVariant({
        sku: dto.sku_bsale,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        barcode: dto.barcode,
      });

      // Guardar localmente con datos del DTO y la respuesta de Bsale
      const datosParaGuardar: Partial<Herramienta> = {
        sku_bsale: dto.sku_bsale,
        id_bsale: nuevaVariante.id,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        barcode: nuevaVariante.barCode || dto.barcode,
        imagen_url: nuevaVariante.image_url || dto.imagen_url,
        precio_diario: dto.precio_diario ?? 0,
        garantia: dto.garantia ?? 0,
        dias_minimo: dto.dias_minimo ?? 1,
        stock: dto.stock ?? 0,
        fecha_sincronizacion: new Date(),
      };

      const herramienta = this.herramientaRepository.create(datosParaGuardar);
      const saved = await this.herramientaRepository.save(herramienta);

      this.logger.log(`✅ Herramienta creada: ${saved.nombre} (ID local: ${saved.id_herramienta}, ID Bsale: ${saved.id_bsale})`);

      return saved;

    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'herramienta');
    }
  }

  /**
   * Obtiene todas las herramientas con búsqueda y paginación
   */
  async findAll(searchDto: SearchHerramientaDto) {
    try {
      const { 
        nombre, 
        sku_bsale, 
        barcode, 
        activo, 
        precio_minimo, 
        precio_maximo,
        disponible,
        page = 1,
        limit = 10 
      } = searchDto;

      const offset = searchDto.getOffset();

      const query = this.herramientaRepository.createQueryBuilder('herramienta');

      // Filtros
      if (nombre) {
        query.andWhere('herramienta.nombre ILIKE :nombre', { 
          nombre: `%${nombre}%` 
        });
      }

      if (sku_bsale) {
        query.andWhere('herramienta.sku_bsale ILIKE :sku', { 
          sku: `%${sku_bsale}%` 
        });
      }

      if (barcode) {
        query.andWhere('herramienta.barcode ILIKE :barcode', { 
          barcode: `%${barcode}%` 
        });
      }

      if (activo !== undefined) {
        query.andWhere('herramienta.activo = :activo', { activo });
      }

      if (precio_minimo !== undefined) {
        query.andWhere('herramienta.precio_diario >= :precio_minimo', { precio_minimo });
      }

      if (precio_maximo !== undefined) {
        query.andWhere('herramienta.precio_diario <= :precio_maximo', { precio_maximo });
      }

      if (disponible) {
        query.andWhere('herramienta.stock > 0');
        query.andWhere('herramienta.activo = true');
      }

      // Contar total antes de paginar
      const total = await query.getCount();

      // Paginar
      const herramientas = await query
        .orderBy('herramienta.nombre', 'ASC')
        .skip(offset)
        .take(limit)
        .getMany();

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;

      return {
        data: herramientas,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
        },
      };

    } catch (error) {
      this.logger.error('Error buscando herramientas:', error.message);
      throw new BadRequestException('Error al buscar herramientas');
    }
  }

  /**
   * Obtiene solo herramientas disponibles (activas y con stock)
   */
  async findDisponibles(searchDto: SearchHerramientaDto) {
    // Set the flag on the DTO instance so its helper methods (e.g. getOffset) remain available
    searchDto.disponible = true;
    return this.findAll(searchDto);
  }

  /**
   * Busca una herramienta por ID
   */
  async findOne(id: number): Promise<Herramienta> {
    try {
      const herramienta = await this.herramientaRepository.findOne({
        where: { id_herramienta: id },
      });

      if (!herramienta) {
        throw new NotFoundException(`Herramienta con ID ${id} no encontrada`);
      }

      return herramienta;

    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'herramienta');
    }
  }

  /**
   * Busca una herramienta por SKU
   */
  async findBySku(sku: string): Promise<Herramienta> {
    try {
      const herramienta = await this.herramientaRepository.findOne({
        where: { sku_bsale: sku },
      });

      if (!herramienta) {
        throw new NotFoundException(`Herramienta con SKU '${sku}' no encontrada`);
      }

      return herramienta;

    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'herramienta');
    }
  }

  /**
   * Actualiza una herramienta
   * IMPORTANTE: También actualiza la variante en Bsale automáticamente
   */
  async update(id: number, dto: UpdateHerramientaDto): Promise<Herramienta> {
    try {
      const herramienta = await this.findOne(id);

      // Verificar que tenga id_bsale para poder actualizar en Bsale
      if (!herramienta.id_bsale) {
        throw new BadRequestException(
          'Esta herramienta no tiene id_bsale. No se puede sincronizar con Bsale.'
        );
      }

      // Verificar unicidad de SKU si se está actualizando
      if (dto.sku_bsale && dto.sku_bsale !== herramienta.sku_bsale) {
        const existeBySku = await this.herramientaRepository.findOne({
          where: { sku_bsale: dto.sku_bsale },
        });

        if (existeBySku) {
          throw new ConflictException(
            `Ya existe otra herramienta con el SKU '${dto.sku_bsale}'`
          );
        }
      }

      // Actualizar en Bsale primero (solo campos que Bsale soporta)
      const camposParaBsale: any = {};

      if (dto.sku_bsale) {
        camposParaBsale.sku = dto.sku_bsale;
      }

      if (dto.nombre) {
        camposParaBsale.nombre = dto.nombre;
      }

      if (dto.barcode !== undefined) {
        camposParaBsale.barcode = dto.barcode;
      }

      // Solo actualizar en Bsale si hay campos para actualizar
      if (Object.keys(camposParaBsale).length > 0) {
        try {
          await this.bsaleService.updateVariant(
            herramienta.id_bsale,
            camposParaBsale
          );
          this.logger.log(`✅ Variante ${herramienta.id_bsale} actualizada en Bsale`);
        } catch (error) {
          this.logger.error(`❌ Error actualizando en Bsale: ${error.message}`);
          throw new BadRequestException(
            `Error al actualizar en Bsale: ${error.message}`
          );
        }
      }

      // Actualizar campos localmente
      Object.assign(herramienta, dto);
      herramienta.updated_at = new Date();
      herramienta.fecha_sincronizacion = new Date();

      const updated = await this.herramientaRepository.save(herramienta);
      this.logger.log(`✅ Herramienta ID ${id} actualizada localmente y en Bsale`);

      return updated;

    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'herramienta');
    }
  }

  /**
   * Soft delete: marca la herramienta como inactiva
   * NOTA: El estado activo/inactivo se maneja SOLO localmente.
   * Bsale no soporta reactivación de variantes, por lo que no sincronizamos el estado.
   */
  async remove(id: number): Promise<void> {
    try {
      const herramienta = await this.findOne(id);

      // Desactivar localmente
      herramienta.activo = false;
      herramienta.updated_at = new Date();

      await this.herramientaRepository.save(herramienta);
      this.logger.log(`✅ Herramienta ID ${id} desactivada (solo local)`);

    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'herramienta');
    }
  }

  /**
   * Reactiva una herramienta
   * NOTA: El estado activo/inactivo se maneja SOLO localmente.
   * Bsale no soporta reactivación de variantes, por lo que no sincronizamos el estado.
   */
  async activate(id: number): Promise<Herramienta> {
    try {
      const herramienta = await this.findOne(id);

      // Activar localmente
      herramienta.activo = true;
      herramienta.updated_at = new Date();

      const updated = await this.herramientaRepository.save(herramienta);
      this.logger.log(`✅ Herramienta ID ${id} reactivada (solo local)`);

      return updated;

    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'herramienta');
    }
  }

  /**
   * Verifica disponibilidad de una herramienta
   */
  async checkDisponibilidad(id: number, cantidad: number = 1) {
    const herramienta = await this.findOne(id);

    const disponible = herramienta.estaDisponible(cantidad);

    return {
      id_herramienta: herramienta.id_herramienta,
      nombre: herramienta.nombre,
      sku_bsale: herramienta.sku_bsale,
      stock_actual: herramienta.stock,
      cantidad_solicitada: cantidad,
      disponible,
      activo: herramienta.activo,
      mensaje: disponible 
        ? `Hay ${herramienta.stock} unidades disponibles` 
        : !herramienta.activo 
          ? 'Herramienta no disponible (inactiva)'
          : `Stock insuficiente. Solo hay ${herramienta.stock} unidades`,
    };
  }

  /**
   * Obtiene estadísticas generales
   */
  async getStats() {
    try {
      const [
        total,
        activas,
        inactivas,
        conStock,
        sinStock,
        valorInventario,
      ] = await Promise.all([
        this.herramientaRepository.count(),
        this.herramientaRepository.count({ where: { activo: true } }),
        this.herramientaRepository.count({ where: { activo: false } }),
        this.herramientaRepository
          .createQueryBuilder('h')
          .where('h.stock > 0')
          .andWhere('h.activo = true')
          .getCount(),
        this.herramientaRepository
          .createQueryBuilder('h')
          .where('h.stock = 0')
          .andWhere('h.activo = true')
          .getCount(),
        this.herramientaRepository
          .createQueryBuilder('h')
          .select('SUM(h.precio_diario * h.stock)', 'total')
          .getRawOne(),
      ]);

      return {
        total,
        activas,
        inactivas,
        conStock,
        sinStock,
        valorInventario: parseInt(valorInventario?.total || '0'),
      };

    } catch (error) {
      this.logger.error('Error obteniendo estadísticas:', error.message);
      throw new BadRequestException('Error al obtener estadísticas');
    }
  }

  // ============================================
  // SINCRONIZACIÓN CON BSALE
  // ============================================

  /**
   * Sincroniza todas las herramientas desde Bsale
   * IMPORTANTE: Solo sincroniza info básica (SKU, nombre, descripción, barcode)
   * Stock y precios quedan en 0 hasta que tengamos los endpoints
   */
  async syncAllFromBsale(): Promise<{ 
    total: number; 
    nuevas: number; 
    actualizadas: number;
    errors: string[];
  }> {
    try {
      this.logger.log('🔄 Iniciando sincronización de herramientas desde Bsale...');

      // Obtener todas las variantes de productos de arriendo
      const variants = await this.bsaleService.getAllVariantsArriendo();

      if (variants.length === 0) {
        this.logger.warn('⚠️  No se encontraron variantes para sincronizar');
        return { total: 0, nuevas: 0, actualizadas: 0, errors: [] };
      }

      let nuevas = 0;
      let actualizadas = 0;
      const errors: string[] = [];

      for (const variant of variants) {
        try {
          await this.syncVariantFromBsale(variant);
          
          // Verificar si es nueva o actualizada
          const herramienta = await this.herramientaRepository.findOne({
            where: { sku_bsale: variant.code },
          });

          if (herramienta) {
            // Si tenemos fecha_sincronizacion y created_at, compararlas
            if (herramienta.fecha_sincronizacion && herramienta.created_at) {
              const tiempoDesdeCreacion = herramienta.fecha_sincronizacion.getTime() - herramienta.created_at.getTime();
              if (tiempoDesdeCreacion < 1000) { // Menos de 1 segundo = nueva
                nuevas++;
              } else {
                actualizadas++;
              }
            } else {
              // No se pudieron comparar fechas, contar como actualizada por seguridad
              actualizadas++;
            }
          } else {
            // Si por alguna razón no existe la herramienta, registrar error
            const errorMsg = `SKU ${variant.code}: herramienta no encontrada tras sincronizar`;
            errors.push(errorMsg);
            this.logger.error(`❌ ${errorMsg}`);
          }

        } catch (error) {
          const errorMsg = `SKU ${variant.code}: ${error.message}`;
          errors.push(errorMsg);
          this.logger.error(`❌ ${errorMsg}`);
        }
      }

      const resultado = {
        total: variants.length,
        nuevas,
        actualizadas,
        errors,
      };

      this.logger.log(`✅ Sincronización completada: ${nuevas} nuevas, ${actualizadas} actualizadas`);
      if (errors.length > 0) {
        this.logger.warn(`⚠️  ${errors.length} errores durante la sincronización`);
      }

      return resultado;

    } catch (error) {
      this.logger.error('❌ Error en sincronización:', error.message);
      throw new BadRequestException('Error al sincronizar herramientas desde Bsale');
    }
  }

  /**
   * Sincroniza una variante específica de Bsale
   * Crea si no existe, actualiza si existe
   * NOTA: El campo 'state' de Bsale se mapea a 'activo' (0=true, 1=false)
   */
  private async syncVariantFromBsale(variant: any): Promise<Herramienta> {
    try {
      const sku = variant.code;

      // Buscar si ya existe
      let herramienta = await this.herramientaRepository.findOne({
        where: { sku_bsale: sku },
      });

      // Mapear state de Bsale a activo (0 = activo, 1 = inactivo en Bsale)
      const activoSegunBsale = variant.state === 0;

      const datosSync = {
        sku_bsale: variant.code,
        id_bsale: variant.id,
        barcode: variant.barCode || null,
        nombre: variant.description || variant.code,
        descripcion: variant.note || null,
        imagen_url: variant.image_url || null,
        fecha_sincronizacion: new Date(),
        // Mapear state de Bsale a activo
        activo: activoSegunBsale,
        // Stock y precios en 0 por ahora (no tenemos endpoints)
        stock: 0,
        precio_diario: 0,
        garantia: 0,
        dias_minimo: 1,
      };

      if (herramienta) {
        // Actualizar existente
        // IMPORTANTE: Solo actualizar 'activo' si la herramienta está inactiva en Bsale
        // Si está activa en tu sistema pero inactiva en Bsale, respetamos Bsale
        // Si está activa en tu sistema y activa en Bsale, mantenemos activa
        const debeSincronizarActivo = variant.state === 1; // Solo forzar inactivo si Bsale dice inactivo

        Object.assign(herramienta, {
          ...datosSync,
          activo: debeSincronizarActivo ? false : herramienta.activo, // Preservar estado local si Bsale está activo
          updated_at: new Date(),
        });

        herramienta = await this.herramientaRepository.save(herramienta);
        this.logger.debug(`📝 Actualizada: ${herramienta.nombre} (activo: ${herramienta.activo}, state Bsale: ${variant.state})`);

      } else {
        // Crear nueva: usar el estado de Bsale directamente
        herramienta = this.herramientaRepository.create(datosSync);
        herramienta = await this.herramientaRepository.save(herramienta);
        this.logger.debug(`🆕 Creada: ${herramienta.nombre} (activo: ${herramienta.activo}, state Bsale: ${variant.state})`);
      }

      return herramienta;

    } catch (error) {
      throw new BadRequestException(
        `Error sincronizando variante ${variant.code}: ${error.message}`
      );
    }
  }

  /**
   * Sincroniza una herramienta específica por SKU desde Bsale
   */
  async syncOneBySku(sku: string): Promise<Herramienta> {
    try {
      this.logger.log(`🔄 Sincronizando herramienta ${sku} desde Bsale...`);

      const variant = await this.bsaleService.findVariantBySku(sku);

      if (!variant) {
        throw new NotFoundException(
          `La variante con SKU '${sku}' no existe en Bsale`
        );
      }

      const herramienta = await this.syncVariantFromBsale(variant);
      this.logger.log(`✅ Herramienta ${sku} sincronizada exitosamente`);

      return herramienta;

    } catch (error) {
      if (error.status) {
        throw error;
      }
      throw new BadRequestException(
        `Error al sincronizar herramienta ${sku}: ${error.message}`
      );
    }
  }
}