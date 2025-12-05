import { IsOptional, IsString } from 'class-validator';

/**
 * DTO para actualizar una garantía devolución
 * Solo permite actualizar campos seguros (referencia, observaciones)
 * No se puede cambiar monto, fecha ni método de devolución
 */
export class UpdateGarantiaDevolucionDto {
  @IsOptional()
  @IsString()
  referencia?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
