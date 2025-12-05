import {
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MetodoPago } from '../enums/metodo-pago.enum';

export class CreatePagoDto {
  @IsNotEmpty({ message: 'El ID del contrato es requerido' })
  @Type(() => Number)
  @IsNumber()
  id_contrato: number;

  @IsNotEmpty({ message: 'La fecha de pago es requerida' })
  @IsDateString()
  fecha_pago: string;

  @IsNotEmpty({ message: 'El monto es requerido' })
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'El monto debe ser mayor a 0' })
  monto: number;

  @IsNotEmpty({ message: 'El método de pago es requerido' })
  @IsEnum(MetodoPago, {
    message:
      'El método de pago debe ser: efectivo, tarjeta_debito, tarjeta_credito o transferencia',
  })
  metodo_pago: MetodoPago;

  @IsOptional()
  @IsString()
  referencia?: string;
}
