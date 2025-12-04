import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DetalleContrato } from '../../contratos/entities/detalle-contrato.entity';
import { EstadoDevolucion } from '../enums/estado-devolucion.enum';

@Entity('devoluciones_herramienta')
@Index(['id_detalle'])
@Index(['fecha_devolucion'])
@Index(['estado'])
export class DevolucionHerramienta {
  @PrimaryGeneratedColumn()
  id_devolucion: number;

  // RELACIÓN CON DETALLE DE CONTRATO
  @Column({ nullable: false })
  id_detalle: number;

  @ManyToOne(() => DetalleContrato, { eager: false })
  @JoinColumn({ name: 'id_detalle' })
  detalle: DetalleContrato;

  // DATOS DE LA DEVOLUCIÓN
  @Column({ type: 'int', nullable: false })
  cantidad_devuelta: number;

  @Column({ type: 'date', nullable: false })
  fecha_devolucion: Date;

  // CÁLCULOS AUTOMÁTICOS (se calculan en el service)
  @Column({ type: 'int', nullable: false })
  dias_reales: number; // fecha_devolucion - contrato.fecha_inicio

  @Column({ type: 'int', nullable: false })
  monto_cobrado: number; // cantidad × precio × dias_reales

  // ESTADO DE LAS HERRAMIENTAS DEVUELTAS
  @Column({
    type: 'enum',
    enum: EstadoDevolucion,
    default: EstadoDevolucion.BUEN_ESTADO,
    nullable: false,
  })
  estado: EstadoDevolucion;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

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
  tieneDanios(): boolean {
    return (
      this.estado === EstadoDevolucion.DANADA ||
      this.estado === EstadoDevolucion.REPARACION_MENOR
    );
  }

  estaBuenEstado(): boolean {
    return this.estado === EstadoDevolucion.BUEN_ESTADO;
  }
}
