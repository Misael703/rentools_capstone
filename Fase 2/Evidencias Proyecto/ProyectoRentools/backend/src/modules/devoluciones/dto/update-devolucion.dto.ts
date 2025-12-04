import { IsOptional, IsEnum, IsString } from 'class-validator';
import { EstadoDevolucion } from '../enums/estado-devolucion.enum';

export class UpdateDevolucionDto {
  @IsOptional()
  @IsEnum(EstadoDevolucion, {
    message:
      'El estado debe ser: buen_estado, danada o reparacion_menor',
  })
  estado?: EstadoDevolucion;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
