import { IsOptional, IsString } from 'class-validator';

/**
 * DTO para actualizar una garantía pago
 * Solo permite actualizar campos seguros (referencia)
 * No se puede cambiar monto, fecha ni método de pago
 */
export class UpdateGarantiaPagoDto {
  @IsOptional()
  @IsString()
  referencia?: string;
}
