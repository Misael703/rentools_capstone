import { PartialType } from '@nestjs/mapped-types';
import { CreateBsaleDto } from './create-bsale.dto';

export class UpdateBsaleDto extends PartialType(CreateBsaleDto) {}
