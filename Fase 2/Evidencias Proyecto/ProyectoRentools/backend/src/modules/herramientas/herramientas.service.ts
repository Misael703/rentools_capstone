import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
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
    @Inject(forwardRef(() => BsaleService))
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

      // Extraer product_id_bsale de la variante
      const productIdBsale = variantEnBsale.product?.id || variantEnBsale.productId;

      if (!productIdBsale) {
        throw new BadRequestException(
          `La variante '${dto.sku_bsale}' en Bsale no tiene un productId asociado`
        );
      }

      // Validar que el producto esté en la configuración y obtener su nombre
      const productConfig = await this.bsaleService.getProductConfigByProductId(productIdBsale);

      if (!productConfig) {
        throw new BadRequestException(
          `El producto ${productIdBsale} no está configurado para arriendo. ` +
          `Agrega el producto a la configuración primero con POST /bsale/products-config/${productIdBsale}`
        );
      }

      // Mapear state de Bsale a activo
      const activoSegunBsale = variantEnBsale.state === 0;

      // Sincronizar datos desde Bsale (source of truth para catálogo)
      const datosParaGuardar: Partial<Herramienta> = {
        sku_bsale: variantEnBsale.code,
        id_bsale: variantEnBsale.id,
        product_id_bsale: productIdBsale,
        product_name_bsale: productConfig.product_name,
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

      this.logger.log(`✅ Herramienta importada desde Bsale: ${saved.nombre} (ID Bsale: ${saved.id_bsale}, Producto: ${saved.product_id_bsale})`);

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
   * Requiere product_id_bsale (categoría) que debe estar en bsale_config
   * Nota: Para sincronización masiva desde Bsale, usar syncAllFromBsale()
   */
  async create(dto: CreateHerramientaDto): Promise<Herramienta> {
    try {
      // 1. Validar que el product_id_bsale esté en la configuración y obtener su nombre
      const productConfig = await this.bsaleService.getProductConfigByProductId(dto.product_id_bsale);

      if (!productConfig) {
        throw new BadRequestException(
          `El producto ${dto.product_id_bsale} no está configurado para arriendo. ` +
          `Agrega el producto a la configuración primero con POST /bsale/products-config/${dto.product_id_bsale}`
        );
      }

      // 2. Verificar que el SKU no exista localmente
      const existeLocal = await this.herramientaRepository.findOne({
        where: { sku_bsale: dto.sku_bsale },
      });

      if (existeLocal) {
        throw new ConflictException(
          `Ya existe una herramienta con el SKU '${dto.sku_bsale}'`
        );
      }

      // 3. Verificar si ya existe en Bsale por SKU
      const variantEnBsale = await this.bsaleService.findVariantBySku(dto.sku_bsale);

      if (variantEnBsale) {
        throw new ConflictException(
          `Ya existe una herramienta con el SKU '${dto.sku_bsale}'`
        );
      }

      // 4. Verificar si el barcode ya existe en Bsale (si viene barcode)
      if (dto.barcode && dto.barcode.trim() !== '') {
        const variantConBarcode = await this.bsaleService.findVariantByBarcode(dto.barcode);

        if (variantConBarcode) {
          throw new ConflictException(
            `Ya existe una variante en Bsale con el código de barras '${dto.barcode}' (SKU: ${variantConBarcode.code})`
          );
        }
      }

      // 5. No existe en ningún lado, crear nueva variante en Bsale
      this.logger.log(`📤 Creando nueva variante en Bsale: ${dto.sku_bsale} (producto: ${dto.product_id_bsale})`);

      const nuevaVariante = await this.bsaleService.createVariant({
        productId: dto.product_id_bsale,
        sku: dto.sku_bsale,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        barcode: dto.barcode,
      });

      // Guardar localmente con datos del DTO y la respuesta de Bsale
      const datosParaGuardar: Partial<Herramienta> = {
        sku_bsale: dto.sku_bsale,
        id_bsale: nuevaVariante.id,
        product_id_bsale: dto.product_id_bsale,
        product_name_bsale: productConfig.product_name,
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
   * IMPORTANTE: Solo sincroniza con Bsale si se modifican campos compartidos
   * Campos compartidos: sku_bsale, nombre, barcode
   * Campos locales: descripcion, garantia, dias_minimo, stock, activo
   */
  async update(id: number, dto: UpdateHerramientaDto): Promise<Herramienta> {
    try {
      const herramienta = await this.findOne(id);

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

      // Verificar si el barcode ya existe en Bsale (si se está modificando y no está vacío)
      if (dto.barcode !== undefined && dto.barcode !== herramienta.barcode && dto.barcode?.trim() !== '') {
        const variantConBarcode = await this.bsaleService.findVariantByBarcode(dto.barcode);

        if (variantConBarcode && variantConBarcode.id !== herramienta.id_bsale) {
          throw new ConflictException(
            `Ya existe una variante en Bsale con el código de barras '${dto.barcode}' (SKU: ${variantConBarcode.code})`
          );
        }
      }

      // Detectar campos compartidos con Bsale que se están modificando
      const camposParaBsale: any = {};
      let requiereSincronizacionBsale = false;

      if (dto.sku_bsale !== undefined && dto.sku_bsale !== herramienta.sku_bsale) {
        camposParaBsale.sku = dto.sku_bsale;
        requiereSincronizacionBsale = true;
      }

      if (dto.nombre !== undefined && dto.nombre !== herramienta.nombre) {
        camposParaBsale.nombre = dto.nombre;
        requiereSincronizacionBsale = true;
      }

      if (dto.barcode !== undefined && dto.barcode !== herramienta.barcode) {
        camposParaBsale.barcode = dto.barcode;
        requiereSincronizacionBsale = true;
      }

      // Solo actualizar en Bsale si hay campos compartidos que cambiar
      if (requiereSincronizacionBsale) {
        if (!herramienta.id_bsale) {
          throw new BadRequestException(
            'Esta herramienta no tiene id_bsale. No se puede sincronizar con Bsale.'
          );
        }

        try {
          await this.bsaleService.updateVariant(
            herramienta.id_bsale,
            camposParaBsale
          );
          this.logger.log(`✅ Variante ${herramienta.id_bsale} actualizada en Bsale (campos: ${Object.keys(camposParaBsale).join(', ')})`);
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

      // Solo actualizar fecha_sincronizacion si se sincronizó con Bsale
      if (requiereSincronizacionBsale) {
        herramienta.fecha_sincronizacion = new Date();
      }

      const updated = await this.herramientaRepository.save(herramienta);

      if (requiereSincronizacionBsale) {
        this.logger.log(`✅ Herramienta ID ${id} actualizada localmente y sincronizada con Bsale`);
      } else {
        this.logger.log(`✅ Herramienta ID ${id} actualizada localmente (solo campos locales)`);
      }

      return updated;

    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'herramienta');
    }
  }

  /**
   * Soft delete: marca la herramienta como inactiva y elimina la variante en Bsale
   * IMPORTANTE: Elimina la variante en Bsale primero, luego desactiva localmente
   */
  async remove(id: number): Promise<void> {
    try {
      const herramienta = await this.findOne(id);

      // Eliminar en Bsale primero (si existe id_bsale)
      if (herramienta.id_bsale) {
        try {
          await this.bsaleService.deleteVariant(herramienta.id_bsale);
          this.logger.log(`✅ Variante ${herramienta.id_bsale} eliminada en Bsale`);
        } catch (error) {
          this.logger.error(`❌ Error eliminando en Bsale: ${error.message}`);
          throw new BadRequestException(
            `Error al eliminar la variante en Bsale: ${error.message}`
          );
        }
      }

      // Desactivar localmente
      herramienta.activo = false;
      herramienta.updated_at = new Date();

      await this.herramientaRepository.save(herramienta);
      this.logger.log(`✅ Herramienta ID ${id} desactivada localmente`);

    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'herramienta');
    }
  }


  /**
   * Desactiva todas las herramientas de un producto específico
   * Se usa cuando se elimina un producto de la configuración
   */
  async deactivateByProductId(productIdBsale: number): Promise<{ desactivadas: number }> {
    try {
      const herramientas = await this.herramientaRepository.find({
        where: {
          product_id_bsale: productIdBsale,
          activo: true, // Solo las que están activas
        },
      });

      if (herramientas.length === 0) {
        this.logger.log(`ℹ️  No hay herramientas activas para desactivar del producto ${productIdBsale}`);
        return { desactivadas: 0 };
      }

      // Desactivar todas
      for (const herramienta of herramientas) {
        herramienta.activo = false;
        herramienta.updated_at = new Date();
      }

      await this.herramientaRepository.save(herramientas);

      this.logger.log(
        `✅ ${herramientas.length} herramientas desactivadas del producto ${productIdBsale}`
      );

      return { desactivadas: herramientas.length };

    } catch (error) {
      this.logger.error(
        `❌ Error desactivando herramientas del producto ${productIdBsale}:`,
        error.message
      );
      throw new BadRequestException(
        `Error al desactivar herramientas del producto ${productIdBsale}`
      );
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
          const resultado = await this.syncVariantFromBsale(variant);

          // Contar según lo que retornó syncVariantFromBsale
          if (resultado.esNueva) {
            nuevas++;
          } else {
            actualizadas++;
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
  private async syncVariantFromBsale(
    variant: any,
    productIdBsale?: number
  ): Promise<{ herramienta: Herramienta; esNueva: boolean }> {
    try {
      const sku = variant.code;

      // Extraer product_id_bsale (desde parámetro, objeto variant, o campo directo)
      const productId = productIdBsale || variant.product?.id || variant.productId;

      if (!productId) {
        throw new BadRequestException(
          `La variante '${sku}' no tiene un productId asociado y no se proporcionó uno`
        );
      }

      // Obtener el nombre del producto desde la configuración
      const productConfig = await this.bsaleService.getProductConfigByProductId(productId);
      const productName = productConfig?.product_name || `Producto ${productId}`;

      // Buscar si ya existe
      const herramientaExistente = await this.herramientaRepository.findOne({
        where: { sku_bsale: sku },
      });

      const esNueva = !herramientaExistente;

      // Mapear state de Bsale a activo (0 = activo, 1 = inactivo en Bsale)
      const activoSegunBsale = variant.state === 0;

      const datosSync = {
        sku_bsale: variant.code,
        id_bsale: variant.id,
        product_id_bsale: productId,
        product_name_bsale: productName,
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

      let herramienta: Herramienta;

      if (herramientaExistente) {
        // Actualizar existente
        // IMPORTANTE: Siempre sincronizar 'activo' según Bsale
        // Si Bsale dice activo (state=0), se reactiva la herramienta
        // Si Bsale dice inactivo (state=1), se desactiva la herramienta
        Object.assign(herramientaExistente, {
          ...datosSync,
          activo: activoSegunBsale, // Siempre respetar el estado de Bsale
          updated_at: new Date(),
        });

        herramienta = await this.herramientaRepository.save(herramientaExistente);
        this.logger.debug(`📝 Actualizada: ${herramienta.nombre} (activo: ${herramienta.activo}, state Bsale: ${variant.state}, producto: ${productId})`);

      } else {
        // Crear nueva: usar el estado de Bsale directamente
        herramienta = this.herramientaRepository.create(datosSync);
        herramienta = await this.herramientaRepository.save(herramienta);
        this.logger.debug(`🆕 Creada: ${herramienta.nombre} (activo: ${herramienta.activo}, state Bsale: ${variant.state}, producto: ${productId})`);
      }

      return { herramienta, esNueva };

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

      const { herramienta } = await this.syncVariantFromBsale(variant);
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