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
import { MetodoPago } from '../../pagos/enums/metodo-pago.enum';

export class CreateGarantiaDevolucionDto {
  @IsNotEmpty({ message: 'El ID del contrato es requerido' })
  @Type(() => Number)
  @IsNumber()
  id_contrato: number;

  @IsNotEmpty({ message: 'La fecha de devolución es requerida' })
  @IsDateString()
  fecha_devolucion: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'El monto devuelto no puede ser negativo' })
  monto_devuelto?: number; // Si no se envía, se calcula automáticamente

  @IsNotEmpty({ message: 'El método de devolución es requerido' })
  @IsEnum(MetodoPago, {
    message:
      'El método de devolución debe ser: efectivo, tarjeta_debito, tarjeta_credito o transferencia',
  })
  metodo_devolucion: MetodoPago;

  @IsOptional()
  @IsString()
  referencia?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
