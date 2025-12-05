import {
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/utils/dtos/pagination.dto';
import { MetodoPago } from '../../pagos/enums/metodo-pago.enum';

export class SearchGarantiaDevolucionDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id_contrato?: number;

  @IsOptional()
  @IsEnum(MetodoPago)
  metodo_devolucion?: MetodoPago;

  @IsOptional()
  @IsDateString()
  fecha_desde?: string;

  @IsOptional()
  @IsDateString()
  fecha_hasta?: string;
}
