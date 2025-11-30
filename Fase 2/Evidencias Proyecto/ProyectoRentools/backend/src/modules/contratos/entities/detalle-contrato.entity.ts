import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Contrato } from './contrato.entity';
import { Herramienta } from '../../herramientas/entities/herramienta.entity';

@Entity('detalles_contrato')
@Index(['id_contrato'])
@Index(['id_herramienta'])
export class DetalleContrato {
  @PrimaryGeneratedColumn()
  id_detalle: number;

  // RELACIONES
  @Column({ nullable: false })
  id_contrato: number;

  @Column({ nullable: false })
  id_herramienta: number;

  @ManyToOne(() => Contrato, (contrato) => contrato.detalles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_contrato' })
  contrato: Contrato;

  @ManyToOne(() => Herramienta, { eager: false })
  @JoinColumn({ name: 'id_herramienta' })
  herramienta: Herramienta;

  // SNAPSHOTS (valores al momento del contrato)
  // Guardamos estos datos para mantener histórico aunque cambie la herramienta
  @Column({ length: 200, nullable: true })
  nombre_herramienta: string;

  @Column({ length: 100, nullable: true })
  sku_herramienta: string;

  // DATOS DEL ARRIENDO
  @Column({ type: 'int', nullable: false })
  cantidad: number;

  @Column({ type: 'int', nullable: false })
  precio_unitario: number; // Precio diario al momento del contrato

  @Column({ type: 'int', nullable: false })
  dias_arriendo: number;

  @Column({ type: 'int', nullable: false })
  subtotal: number; // cantidad * precio_unitario * dias_arriendo

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
  calcularSubtotal(): number {
    return this.cantidad * this.precio_unitario * this.dias_arriendo;
  }

  getStockNecesario(): number {
    return this.cantidad;
  }
}
