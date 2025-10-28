import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import * as bcrypt from 'bcrypt';
import { Rol } from '../rol/entities/rol.entity';
import { DatabaseErrorHandler } from 'src/common/utils/database-errors.handler';
import { CreateUsuarioDto } from './dtos/create-usuario.dto';
import { UpdateUsuarioDto } from './dtos/update-usuario.dto';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,

    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,

    private readonly dataSource: DataSource,
  ) {}

async create(dto: CreateUsuarioDto): Promise<any> {
  try {
    // 1. Validar que el rol exista ANTES de intentar crear
    const rol = await this.rolRepo.findOne({ 
      where: { id_rol: dto.id_rol } 
    });
    
    if (!rol) {
      throw new NotFoundException(
        `El rol con ID ${dto.id_rol} no existe. ` +
        `Usa GET /roles para ver los roles disponibles.`
      );
    }

    // 2. Verificar si el email ya existe
    const existingUser = await this.usuarioRepo.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException(
        `El email '${dto.email}' ya está registrado.`
      );
    }

    // 3. Separar password del resto de datos
    const { password, ...userData } = dto;

    // 4. Crear usuario con password hasheado
    const newUser = this.usuarioRepo.create({
      ...userData,
      password: bcrypt.hashSync(password, 10),
    });

    // 5. Guardar en base de datos
    await this.usuarioRepo.save(newUser);

    // 6. Eliminar password de la respuesta
    delete (newUser as any).password;

    // 7. Retornar usuario sin password
    return newUser;

  } catch (error) {
    // Si ya es una excepción HTTP de NestJS, relanzarla
    if (error.status) {
      throw error;
    }
    // Si es un error de base de datos, manejarlo
    DatabaseErrorHandler.handle(error, 'usuario');
  }
}

  async findAll(): Promise<Usuario[]> {
    return this.usuarioRepo.find();
  }
  
  async findByEmail(email: string): Promise<Usuario | undefined> {
    try {
      const user = await this.usuarioRepo
        .createQueryBuilder('usuario')
        .leftJoinAndSelect('usuario.rol', 'rol')
        .where('usuario.email = :email', { email })
        .getOne();

      return user ?? undefined;
    } catch (error) {
      DatabaseErrorHandler.handle(error, 'usuario');
    }
  }

  async findById(id: number): Promise<Usuario> {
    // Validar ID antes de consultar
    if (!id || isNaN(id) || id <= 0) {
      throw new BadRequestException('ID de usuario inválido');
    }

    try {
      const user = await this.usuarioRepo.findOne({ 
        where: { id_usuario: id },
        relations: ['rol'],
      });
      
      if (!user) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }
      
      return user;
    } catch (error) {
      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'usuario');
    }
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario> {
    // Validar que updateData no esté vacío
    if (!updateUsuarioDto || Object.keys(updateUsuarioDto).length === 0) {
      throw new BadRequestException('No se enviaron datos para actualizar');
    }

    const { password, ...toUpdate } = updateUsuarioDto;

    // Usar preload para cargar el usuario con los nuevos datos
    const usuario = await this.usuarioRepo.preload({
      id_usuario: id,
      ...toUpdate,
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Crear query runner para transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Si se actualiza el rol, verificar que exista
      if (updateUsuarioDto.id_rol !== undefined) {
        const rol = await queryRunner.manager.findOne(Rol, {
          where: { id_rol: updateUsuarioDto.id_rol }
        });

        if (!rol) {
          throw new NotFoundException(
            `El rol con ID ${updateUsuarioDto.id_rol} no existe`
          );
        }
      }

      // 2. Si se actualiza el email, verificar duplicados
      if (updateUsuarioDto.email) {
        const existingUser = await queryRunner.manager.findOne(Usuario, {
          where: { email: updateUsuarioDto.email },
        });

        if (existingUser && existingUser.id_usuario !== id) {
          throw new ConflictException(
            `El email '${updateUsuarioDto.email}' ya está en uso por otro usuario`
          );
        }
      }

      // 3. Si se actualiza el password, hashearlo
      if (password) {
        usuario.password = await bcrypt.hash(password, 10);
      }

      // 4. Guardar usuario actualizado
      await queryRunner.manager.save(usuario);

      // 5. Commit de la transacción
      await queryRunner.commitTransaction();
      await queryRunner.release();

      // 6. Retornar usuario actualizado con relaciones
      return this.findById(id);

    } catch (error) {
      // Rollback en caso de error
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      if (error.status) {
        throw error;
      }
      DatabaseErrorHandler.handle(error, 'usuario');
    }
  }

  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    await this.usuarioRepo.remove(user);
  }

  async softDelete(id: number): Promise<Usuario> {
    const user = await this.findById(id);
    user.activo = false;
    return this.usuarioRepo.save(user);
  }

  async activate(id: number): Promise<Usuario> {
    const user = await this.findById(id);
    user.activo = true;
    return this.usuarioRepo.save(user);
  }
}