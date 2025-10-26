import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateClienteDto } from './create-cliente.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateClienteDto extends PartialType(
    OmitType(CreateClienteDto, ['rut', 'id_bsale'] as const),
) {
    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
