import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/utils/dtos/pagination.dto';

export class SearchClienteDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  nombre?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  rut?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  email?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  telefono?: string;

  // activo ya viene de PaginationDto si lo agregamos allí,
  // o lo podemos dejar aquí si no todos los módulos lo necesitan
}
