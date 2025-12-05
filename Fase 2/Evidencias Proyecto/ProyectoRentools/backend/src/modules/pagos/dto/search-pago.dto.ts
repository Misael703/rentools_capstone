import {
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/utils/dtos/pagination.dto';
import { MetodoPago } from '../enums/metodo-pago.enum';

export class SearchPagoDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id_contrato?: number;

  @IsOptional()
  @IsEnum(MetodoPago)
  metodo_pago?: MetodoPago;

  @IsOptional()
  @IsDateString()
  fecha_pago?: string;

  @IsOptional()
  @IsDateString()
  fecha_desde?: string;

  @IsOptional()
  @IsDateString()
  fecha_hasta?: string;
}
