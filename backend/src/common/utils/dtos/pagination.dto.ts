import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'La página debe ser mayor o igual a 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'El límite debe ser mayor o igual a 1' })
  @Max(100, { message: 'El límite no puede ser mayor a 100' })
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;

  /**
   * Calcula el offset basado en page y limit
   */
  getOffset(): number {
    if (this.offset !== undefined) {
      return this.offset;
    }
    const page = this.page ?? 1;
    const limit = this.limit ?? 10;
    return (page - 1) * limit;
  }
}