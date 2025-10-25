import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Rol } from '../../rol/entities/rol.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id_usuario: number;

  @Column()
  nombre: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @ManyToOne(() => Rol, rol => rol.usuarios, { eager: true })
  @JoinColumn({ name: 'id_rol' })
  rol: Rol;
}