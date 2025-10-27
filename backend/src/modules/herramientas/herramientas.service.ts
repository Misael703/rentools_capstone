import { Injectable } from '@nestjs/common';
import { CreateHerramientaDto } from './dto/create-herramienta.dto';
import { UpdateHerramientaDto } from './dto/update-herramienta.dto';

@Injectable()
export class HerramientasService {
  create(createHerramientaDto: CreateHerramientaDto) {
    return 'This action adds a new herramienta';
  }

  findAll() {
    return `This action returns all herramientas`;
  }

  findOne(id: number) {
    return `This action returns a #${id} herramienta`;
  }

  update(id: number, updateHerramientaDto: UpdateHerramientaDto) {
    return `This action updates a #${id} herramienta`;
  }

  remove(id: number) {
    return `This action removes a #${id} herramienta`;
  }
}
