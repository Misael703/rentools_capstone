import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateContratoDto } from './create-contrato.dto';

// Omitimos campos que NO se pueden actualizar directamente
export class UpdateContratoDto extends PartialType(
  OmitType(CreateContratoDto, [
    'id_cliente',
    'fecha_inicio',
    'fecha_termino_estimada',
    'detalles',
  ] as const),
) {
  // Permitimos actualizar la garantía manualmente (ajustes especiales)
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto de garantía debe ser un número' })
  @Min(0, { message: 'El monto de garantía no puede ser negativo' })
  monto_garantia?: number;

  // Solo se pueden actualizar:
  // - tipo_entrega
  // - monto_garantia (ajuste manual)
  // - observaciones
}
