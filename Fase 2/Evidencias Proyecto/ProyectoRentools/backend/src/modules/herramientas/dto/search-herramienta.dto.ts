import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from '../../../common/utils/dtos/pagination.dto';

export class SearchHerramientaDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  nombre?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  sku_bsale?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  barcode?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  activo?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  precio_minimo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  precio_maximo?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  disponible?: boolean; // Filtra solo herramientas con stock > 0
}