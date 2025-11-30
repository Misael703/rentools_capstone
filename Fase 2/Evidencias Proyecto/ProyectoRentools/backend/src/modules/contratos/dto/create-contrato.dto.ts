import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsEnum,
  IsString,
  IsOptional,
  IsDateString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoEntrega } from '../enums/tipo-entrega.enum';
import { CreateDetalleContratoDto } from './create-detalle-contrato.dto';

export class CreateContratoDto {
  @IsNotEmpty({ message: 'El ID del cliente es requerido' })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del cliente debe ser un número' })
  @IsPositive({ message: 'El ID del cliente debe ser positivo' })
  id_cliente: number;

  @IsNotEmpty({ message: 'El tipo de entrega es requerido' })
  @IsEnum(TipoEntrega, {
    message: 'El tipo de entrega debe ser "retiro" o "despacho"',
  })
  tipo_entrega: TipoEntrega;

  @IsNotEmpty({ message: 'La fecha de inicio es requerida' })
  @IsDateString(
    {},
    { message: 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)' },
  )
  fecha_inicio: string;

  @IsNotEmpty({ message: 'La fecha de término estimada es requerida' })
  @IsDateString(
    {},
    {
      message:
        'La fecha de término estimada debe ser una fecha válida (YYYY-MM-DD)',
    },
  )
  fecha_termino_estimada: string;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;

  @IsNotEmpty({ message: 'Los detalles del contrato son requeridos' })
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'Debe haber al menos un detalle en el contrato' })
  @Type(() => CreateDetalleContratoDto)
  detalles: CreateDetalleContratoDto[];
}
