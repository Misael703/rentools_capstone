import { IsOptional, IsString } from 'class-validator';

export class UpdatePagoDto {
  @IsOptional()
  @IsString()
  referencia?: string;
}
