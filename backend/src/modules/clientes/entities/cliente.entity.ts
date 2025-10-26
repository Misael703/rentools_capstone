import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('clientes')
@Index(['rut'], { unique: true })
@Index(['id_bsale'], { unique: true, where: '"id_bsale" IS NOT NULL' })
export class Cliente {

    @PrimaryGeneratedColumn()
    id_cliente: number;

    @Column({unique: true, length: 12})
    rut: string;

    @Column({ length: 100 })
    nombre: string;

    @Column({ nullable: true, length: 100 })
    email: string;

    @Column({ nullable: true, length: 15 })
    telefono: string;

    @Column({ nullable: true, length: 200 })
    direccion: string;

    @Column({ nullable: true, unique: true })
    id_bsale: number;

    @Column({  nullable: true, type: 'timestamp' })
    fecha_sincronizacion: Date;

    @Column({ default: true })
    activo: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha_creacion: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    fecha_modificacion: Date;

    // Crear Relacion con Contratos cuando se cree la entidad Contrato
    // @OneToMany(() => Contrato, contrato => contrato.cliente)
    // contratos: Contrato[];
}
