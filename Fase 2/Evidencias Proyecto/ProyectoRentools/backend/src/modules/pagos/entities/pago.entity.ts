import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Contrato } from '../../contratos/entities/contrato.entity';
import { MetodoPago } from '../enums/metodo-pago.enum';

@Entity('pagos')
@Index(['id_contrato'])
@Index(['fecha_pago'])
@Index(['metodo_pago'])
export class Pago {
  @PrimaryGeneratedColumn()
  id_pago: number;

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

  // RELACIÓN CON DTE (se llenará después)
  @Column({ type: 'int', nullable: true })
  id_dte: number;

  // CONTROL
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  // MÉTODOS HELPER
  esEfectivo(): boolean {
    return this.metodo_pago === MetodoPago.EFECTIVO;
  }

  esElectronico(): boolean {
    return (
      this.metodo_pago === MetodoPago.TARJETA_DEBITO ||
      this.metodo_pago === MetodoPago.TARJETA_CREDITO ||
      this.metodo_pago === MetodoPago.TRANSFERENCIA
    );
  }

  tieneDTE(): boolean {
    return this.id_dte !== null && this.id_dte !== undefined;
  }
}
