import {
  IsNotEmpty,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDevolucionDto } from './create-devolucion.dto';

export class CreateDevolucionMasivaDto {
  @IsNotEmpty({ message: 'Las devoluciones son requeridas' })
  @IsArray({ message: 'Las devoluciones deben ser un array' })
  @ArrayMinSize(1, {
    message: 'Debe incluir al menos una devolución',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateDevolucionDto)
  devoluciones: CreateDevolucionDto[];
}
