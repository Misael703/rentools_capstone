import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { BsaleConfig } from './bsale-config.entity';

@Entity('bsale_products')
export class BsaleProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  product_id_bsale: number;

  @Column({ length: 255, nullable: true })
  name: string;

  @Column({ default: 0 })
  state: number; // 0 = activo, 1 = inactivo en Bsale

  @Column({ default: false })
  en_configuracion: boolean; // Si está en la configuración de arriendo

  @Column({ type: 'timestamp', nullable: true })
  fecha_sincronizacion: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToOne(() => BsaleConfig, config => config.product, { nullable: true })
  config: BsaleConfig;

  // Helper: producto está activo en Bsale
  get estaActivoEnBsale(): boolean {
    return this.state === 0;
  }
}
