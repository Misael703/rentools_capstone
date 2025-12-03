// src/modules/clientes/dto/autocomplete-cliente.dto.ts
import { IsOptional, IsString, MinLength, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * DTO para búsqueda de autocompletado de clientes
 * Busca en múltiples campos: nombre, apellido, nombre completo, razón social y RUT
 */
export class AutocompleteClienteDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Debe ingresar al menos 3 caracteres para buscar' })
  @Transform(({ value }) => value?.trim())
  query?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number = 10; // Máximo 20 resultados para autocompletado
}
