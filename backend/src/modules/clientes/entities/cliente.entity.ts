import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { TipoCliente } from "../enums/tipo-cliente.enums";

@Entity('clientes')
@Index(['rut'], { unique: true })
@Index(['id_bsale'], { unique: true, where: '"id_bsale" IS NOT NULL' })
export class Cliente {

    @PrimaryGeneratedColumn()
    id_cliente: number;

    @Column({unique: true, length: 12})
    rut: string;

    @Column({ type: 'enum', enum: TipoCliente, default: TipoCliente.PERSONA_NATURAL })
    tipo_cliente: TipoCliente;

    // CAMPOS PARA PERSONA NATURAL
    @Column({ nullable: true, length: 100 })
    nombre: string;

    @Column({ nullable: true, length: 100 })
    apellido: string;

    // CAMPOS PARA EMPRESA
    @Column({ nullable: true, length: 150 })
    razon_social: string;

    @Column({ nullable: true, length: 100 })
    nombre_fantasia: string;

    @Column({ nullable: true, length: 100 })
    giro: string;

    // CAMPOS COMUNES
    @Column({ nullable: true, length: 100 })
    email: string;

    @Column({ nullable: true, length: 15 })
    telefono: string;

    @Column({ nullable: true, length: 200 })
    direccion: string;

    @Column({ nullable: true, length: 100 })
    ciudad: string;
    
    @Column({ nullable: true, length: 100 })
    comuna: string;

    // BSALE SINCRONIZACION
    @Column({ nullable: true, unique: true })
    id_bsale: number;

    @Column({  nullable: true, type: 'timestamp' })
    fecha_sincronizacion: Date;

    //CONTROL
    @Column({ default: true })
    activo: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha_creacion: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    fecha_modificacion: Date;

    // Método helper
    getNombreCompleto(): string {
    if (this.tipo_cliente === TipoCliente.PERSONA_NATURAL) {
      return `${this.nombre || ''} ${this.apellido || ''}`.trim();
    }
    return this.nombre_fantasia || this.razon_social || '';
  }

    // Crear Relacion con Contratos cuando se cree la entidad Contrato
    // @OneToMany(() => Contrato, contrato => contrato.cliente)
    // contratos: Contrato[];
}
