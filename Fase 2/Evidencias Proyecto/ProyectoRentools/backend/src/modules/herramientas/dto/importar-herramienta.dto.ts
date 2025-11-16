import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class ImportarHerramientaDto {
  @IsString()
  sku_bsale: string;

  @IsNumber()
  @Min(0)
  precio_diario: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  garantia?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  dias_minimo?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;
}
