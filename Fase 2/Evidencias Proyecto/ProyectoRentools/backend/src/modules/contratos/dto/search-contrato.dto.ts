import {
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/utils/dtos/pagination.dto';
import { EstadoContrato } from '../enums/estado-contrato.enum';
import { TipoEntrega } from '../enums/tipo-entrega.enum';

export class SearchContratoDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id_cliente?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id_usuario?: number;

  @IsOptional()
  @IsEnum(EstadoContrato)
  estado?: EstadoContrato;

  @IsOptional()
  @IsEnum(TipoEntrega)
  tipo_entrega?: TipoEntrega;

  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  @IsOptional()
  @IsDateString()
  fecha_termino_estimada?: string;

  @IsOptional()
  @IsDateString()
  fecha_inicio_desde?: string;

  @IsOptional()
  @IsDateString()
  fecha_inicio_hasta?: string;
}
