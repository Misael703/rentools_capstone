import {
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/utils/dtos/pagination.dto';
import { EstadoDevolucion } from '../enums/estado-devolucion.enum';

export class SearchDevolucionDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id_contrato?: number;

  @IsOptional()
  @IsEnum(EstadoDevolucion)
  estado?: EstadoDevolucion;

  @IsOptional()
  @IsDateString()
  fecha_devolucion?: string;
}
