import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { BsaleProduct } from './bsale-product.entity';

@Entity('bsale_config')
export class BsaleConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  product_id_bsale: number;

  @Column({ length: 200 })
  product_name: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToOne(() => BsaleProduct, product => product.config)
  @JoinColumn({ name: 'product_id_bsale', referencedColumnName: 'product_id_bsale' })
  product: BsaleProduct;
}
 