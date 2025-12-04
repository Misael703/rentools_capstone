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
import { EstadoDevolucion } from '../enums/estado-devolucion.enum';

export class CreateDevolucionDto {
  @IsNotEmpty({ message: 'El ID del detalle es requerido' })
  @Type(() => Number)
  @IsNumber()
  id_detalle: number;

  @IsNotEmpty({ message: 'La cantidad devuelta es requerida' })
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'La cantidad devuelta debe ser mayor a 0' })
  cantidad_devuelta: number;

  @IsNotEmpty({ message: 'La fecha de devolución es requerida' })
  @IsDateString()
  fecha_devolucion: string;

  @IsNotEmpty({ message: 'El estado de la herramienta es requerido' })
  @IsEnum(EstadoDevolucion, {
    message:
      'El estado debe ser: buen_estado, danada o reparacion_menor',
  })
  estado: EstadoDevolucion;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
