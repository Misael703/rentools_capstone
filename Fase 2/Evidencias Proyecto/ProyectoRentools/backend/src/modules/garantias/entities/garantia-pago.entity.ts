import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Contrato } from '../../contratos/entities/contrato.entity';
import { MetodoPago } from '../../pagos/enums/metodo-pago.enum';

/**
 * Entidad que representa el pago de garantía al inicio del contrato
 * - Solo puede haber UNA garantía pago por contrato (unique constraint)
 * - Se cobra al inicio del contrato (obligatorio)
 * - El monto debe coincidir con contrato.monto_garantia
 */
@Entity('garantia_pago')
@Index(['id_contrato'], { unique: true }) // Solo UNA garantía por contrato
@Index(['fecha_pago'])
export class GarantiaPago {
  @PrimaryGeneratedColumn()
  id_garantia_pago: number;

  // RELACIÓN CON CONTRATO
  @Column({ nullable: false })
  id_contrato: number;

  @ManyToOne(() => Contrato, { eager: false })
  @JoinColumn({ name: 'id_contrato' })
  contrato: Contrato;

  // DATOS DEL PAGO
  @Column({ type: 'date', nullable: false })
  fecha_pago: Date;

  @Column({ type: 'int', nullable: false })
  monto: number;

  @Column({
    type: 'enum',
    enum: MetodoPago,
    nullable: false,
  })
  metodo_pago: MetodoPago;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referencia: string;

  // TIMESTAMPS
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}
