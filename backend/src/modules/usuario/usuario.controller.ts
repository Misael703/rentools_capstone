import { Controller, Get, Post, Body, UseGuards, Param, Delete, HttpCode, HttpStatus, ParseIntPipe, Patch } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../rol/guards/roles.guard';
import { Roles } from '../rol/decorators/roles.decorator';
import { CreateUsuarioDto } from './dtos/create-usuario.dto';
import { UpdateUsuarioDto } from './dtos/update-usuario.dto';

@Controller('usuario')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Get()
  @Roles('admin')
  findAll() {
    return this.usuarioService.findAll();
  }

  @Get('email/:email')
  @Roles('admin')
  findOneByEmail(@Param('email') email: string) {
    return this.usuarioService.findByEmail(email);
  }

  @Get('id/:id')
  @Roles('admin')
  findOneById(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.findById(id);
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuarioService.create(dto);
  }

  @Patch('/:id')
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ) {
    return this.usuarioService.update(id, updateUsuarioDto);
  }

  @Patch('activar/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async activate(@Param('id', ParseIntPipe) id: number) {
    const usuario = await this.usuarioService.activate(id);
    return {
      message: 'Usuario activado correctamente',
      success: true,
      data: usuario,
    };
  }

  @Patch('desactivar/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    const usuario = await this.usuarioService.softDelete(id);
    return {
      message: 'Usuario desactivado correctamente',
      success: true,
      data: usuario,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.usuarioService.remove(+id);
    return { 
      message: 'Usuario eliminado correctamente',
      success: true,
    };
  }
}
