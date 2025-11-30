import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { EstadoContrato } from '../enums/estado-contrato.enum';
import { TipoEntrega } from '../enums/tipo-entrega.enum';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { DetalleContrato } from './detalle-contrato.entity';

@Entity('contratos')
@Index(['id_cliente'])
@Index(['id_usuario'])
@Index(['estado'])
@Index(['fecha_inicio'])
@Index(['fecha_termino_estimada'])
export class Contrato {
  @PrimaryGeneratedColumn()
  id_contrato: number;

  // RELACIONES
  @Column({ nullable: false })
  id_cliente: number;

  @Column({ nullable: false })
  id_usuario: number;

  @ManyToOne(() => Cliente, { eager: false })
  @JoinColumn({ name: 'id_cliente' })
  cliente: Cliente;

  @ManyToOne(() => Usuario, { eager: false })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @OneToMany(() => DetalleContrato, (detalle) => detalle.contrato, {
    cascade: true,
  })
  detalles: DetalleContrato[];

  // FECHAS
  @Column({ type: 'date', nullable: false })
  fecha_inicio: Date;

  @Column({ type: 'date', nullable: false })
  fecha_termino_estimada: Date;

  @Column({ type: 'date', nullable: true })
  fecha_termino_real: Date;

  // ESTADO Y TIPO
  @Column({
    type: 'enum',
    enum: EstadoContrato,
    default: EstadoContrato.ACTIVO,
    nullable: false,
  })
  estado: EstadoContrato;

  @Column({
    type: 'enum',
    enum: TipoEntrega,
    nullable: false,
  })
  tipo_entrega: TipoEntrega;

  // MONTOS (en pesos chilenos)
  @Column({ type: 'int', nullable: false })
  monto_estimado: number;

  @Column({ type: 'int', nullable: true })
  monto_final: number;

  @Column({ type: 'int', default: 0, nullable: false })
  monto_garantia: number;

  // OBSERVACIONES
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
  estaActivo(): boolean {
    return this.estado === EstadoContrato.ACTIVO;
  }

  estaVencido(): boolean {
    if (this.estado !== EstadoContrato.ACTIVO) {
      return false;
    }
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaTermino = new Date(this.fecha_termino_estimada);
    fechaTermino.setHours(0, 0, 0, 0);
    return fechaTermino < hoy;
  }

  getDiasTranscurridos(): number {
    const hoy = new Date();
    const inicio = new Date(this.fecha_inicio);
    const diffTime = Math.abs(hoy.getTime() - inicio.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDiasRestantes(): number {
    const hoy = new Date();
    const termino = new Date(this.fecha_termino_estimada);
    const diffTime = termino.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
