import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HerramientasService } from './herramientas.service';
import { CreateHerramientaDto } from './dto/create-herramienta.dto';
import { UpdateHerramientaDto } from './dto/update-herramienta.dto';

@Controller('herramientas')
export class HerramientasController {
  constructor(private readonly herramientasService: HerramientasService) {}

  @Post()
  create(@Body() createHerramientaDto: CreateHerramientaDto) {
    return this.herramientasService.create(createHerramientaDto);
  }

  @Get()
  findAll() {
    return this.herramientasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.herramientasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHerramientaDto: UpdateHerramientaDto) {
    return this.herramientasService.update(+id, updateHerramientaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.herramientasService.remove(+id);
  }
}
