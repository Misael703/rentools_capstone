import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn()
  id_rol: number;

  @Column({ unique: true })
  nombre: string;

  @OneToMany(() => Usuario, usuario => usuario.rol)
  usuarios: Usuario[];
}