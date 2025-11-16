import { 
  IsNotEmpty, 
  IsString, 
  IsOptional,
  IsInt,
  Min,
  MinLength,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateHerramientaDto {
  @IsNotEmpty({ message: 'El SKU es obligatorio' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  sku_bsale: string;

  @IsOptional()
  @IsInt()
  id_bsale?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  barcode?: string;

  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  nombre: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'El precio diario no puede ser negativo' })
  precio_diario?: number;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'La garantía no puede ser negativa' })
  garantia?: number;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Los días mínimos deben ser al menos 1' })
  dias_minimo?: number;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock?: number;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Debe ser una URL válida' })
  @MaxLength(500)
  imagen_url?: string;
}