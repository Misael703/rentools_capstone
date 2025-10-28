import { PartialType } from '@nestjs/mapped-types';
import { CreateUsuarioDto } from './create-usuario.dto';
import { IsOptional, IsString, IsEmail, MinLength, IsPositive, IsNumber, IsBoolean } from 'class-validator';

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6) 
  password?: string;

  @IsOptional()
  @IsPositive()
  @IsNumber()
  id_rol?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}