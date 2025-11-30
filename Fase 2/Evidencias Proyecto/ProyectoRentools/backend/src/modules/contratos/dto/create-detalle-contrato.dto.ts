import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDetalleContratoDto {
  @IsNotEmpty({ message: 'El ID de la herramienta es requerido' })
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID de la herramienta debe ser un número' })
  @IsPositive({ message: 'El ID de la herramienta debe ser positivo' })
  id_herramienta: number;

  @IsNotEmpty({ message: 'La cantidad es requerida' })
  @Type(() => Number)
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  cantidad: number;

  @IsNotEmpty({ message: 'Los días de arriendo son requeridos' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Los días de arriendo deben ser un número' })
  @Min(1, { message: 'Los días de arriendo deben ser al menos 1' })
  dias_arriendo: number;
}
