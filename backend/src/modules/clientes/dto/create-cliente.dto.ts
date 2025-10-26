import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateClienteDto {

    @IsNotEmpty()
    @IsString()
    @Matches(/^\d{7,8}-[kK\d]$/, { message: 'El RUT debe tener el formato correcto (ejemplo: 12345678-9 o 1234567-K)' })
    @Transform(({ value }) => value?.trim())
    rut: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    @MaxLength(100)
    @Transform(({ value }) => value?.trim())
    nombre: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    @Transform(({ value }) => value?.trim().toLowerCase())
    email?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    @Transform(({ value }) => value?.trim())
    telefono?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    @Transform(({ value }) => value?.trim())
    direccion?: string;

    @IsOptional()
    id_bsale?: number;
}
