// src/modules/clientes/dto/create-cliente.dto.ts
import { 
  IsNotEmpty, 
  IsString, 
  IsEmail, 
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoCliente } from '../enums/tipo-cliente.enums';

export class CreateClienteDto {
  @IsNotEmpty({ message: 'El RUT es obligatorio' })
  @IsString()
  @Matches(/^\d{7,8}-[\dkK]$/, { 
    message: 'El RUT debe tener el formato: 12345678-9' 
  })
  @Transform(({ value }) => value?.trim())
  rut: string;

  @IsEnum(TipoCliente, { message: 'Tipo de cliente inválido' })
  @IsNotEmpty({ message: 'El tipo de cliente es obligatorio' })
  tipo_cliente: TipoCliente;

  // PERSONA NATURAL
  @ValidateIf(o => o.tipo_cliente === TipoCliente.PERSONA_NATURAL)
  @IsNotEmpty({ message: 'El nombre es obligatorio para persona natural' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  nombre?: string;

  @ValidateIf(o => o.tipo_cliente === TipoCliente.PERSONA_NATURAL)
  @IsNotEmpty({ message: 'El apellido es obligatorio para persona natural' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  apellido?: string;

  // EMPRESA
  @ValidateIf(o => o.tipo_cliente === TipoCliente.EMPRESA)
  @IsNotEmpty({ message: 'La razón social es obligatoria para empresa' })
  @IsString()
  @MaxLength(150)
  @Transform(({ value }) => value?.trim())
  razon_social?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  nombre_fantasia?: string;

  @ValidateIf(o => o.tipo_cliente === TipoCliente.EMPRESA)
  @IsNotEmpty({ message: 'El giro es obligatorio para empresa' })
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  giro?: string;

  // COMUNES
  @IsOptional()
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @MaxLength(100)
  @Transform(({ value }) => value?.trim().toLowerCase())
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  @Transform(({ value }) => value?.trim())
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  ciudad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  comuna?: string;

  @IsOptional()
  id_bsale?: number;
}