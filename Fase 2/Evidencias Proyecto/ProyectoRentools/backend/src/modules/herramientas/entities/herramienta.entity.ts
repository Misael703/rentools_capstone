import { 
  Column, 
  Entity, 
  Index, 
  PrimaryGeneratedColumn 
} from 'typeorm';

@Entity('herramientas')
@Index(['sku_bsale'], { unique: true })
@Index(['id_bsale'], { unique: true, where: '"id_bsale" IS NOT NULL' })
export class Herramienta {
  
  @PrimaryGeneratedColumn()
  id_herramienta: number;

  // SINCRONIZACIÓN BSALE
  @Column({ unique: true, length: 100 })
  sku_bsale: string;

  @Column({ nullable: true, unique: true })
  id_bsale: number;

  @Column({ nullable: false })
  product_id_bsale: number; // ID del producto (categoría) en Bsale

  @Column({ nullable: true, length: 200 })
  product_name_bsale: string; // Nombre del producto (categoría) en Bsale

  @Column({ nullable: true, length: 100 })
  barcode: string;

  // INFORMACIÓN BÁSICA
  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  // PRECIOS Y COSTOS
  @Column({ type: 'int', default: 0 })
  precio_diario: number;

  @Column({ type: 'int', default: 0 })
  garantia: number;

  @Column({ type: 'int', default: 1 })
  dias_minimo: number;

  // STOCK
  @Column({ type: 'int', default: 0 })
  stock: number; // Stock sincronizado desde Bsale

  // MULTIMEDIA
  @Column({ nullable: true, length: 500 })
  imagen_url: string;

  // CONTROL Y SINCRONIZACIÓN
  @Column({ default: true })
  activo: boolean;

  @Column({ type: 'timestamp', nullable: true })
  fecha_sincronizacion: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  // MÉTODOS HELPER
  estaDisponible(cantidad: number = 1): boolean {
    return this.activo && this.stock >= cantidad;
  }

  // Para usar en relaciones futuras
  // @OneToMany(() => DetalleContrato, detalle => detalle.herramienta)
  // detalles_contrato: DetalleContrato[];
}