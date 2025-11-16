import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateHerramientaDto } from './create-herramienta.dto';

// Omite id_bsale porque no debería poder modificarse manualmente
export class UpdateHerramientaDto extends PartialType(
  OmitType(CreateHerramientaDto, ['id_bsale'] as const)
) {}