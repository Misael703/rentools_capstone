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
 * Entidad que representa la devolución de garantía al final del contrato
 * - Solo puede haber UNA devolución por contrato (unique constraint)
 * - Se devuelve cuando el contrato está finalizado
 * - El monto puede ser menor si hubo daños en las herramientas
 * - NUNCA se devuelve parcialmente durante el contrato
 */
@Entity('garantia_devolucion')
@Index(['id_contrato'], { unique: true }) // Solo UNA devolución por contrato
@Index(['fecha_devolucion'])
export class GarantiaDevolucion {
  @PrimaryGeneratedColumn()
  id_devolucion_garantia: number;

  // RELACIÓN CON CONTRATO
  @Column({ nullable: false })
  id_contrato: number;

  @ManyToOne(() => Contrato, { eager: false })
  @JoinColumn({ name: 'id_contrato' })
  contrato: Contrato;

  // DATOS DE LA DEVOLUCIÓN
  @Column({ type: 'date', nullable: false })
  fecha_devolucion: Date;

  @Column({ type: 'int', nullable: false })
  monto_devuelto: number; // Puede ser menor si hubo daños

  @Column({
    type: 'enum',
    enum: MetodoPago,
    nullable: false,
  })
  metodo_devolucion: MetodoPago;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referencia: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string; // Explicar por qué se devolvió menos

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
