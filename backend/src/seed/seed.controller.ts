import { Controller, Post, UseGuards } from '@nestjs/common';
import { SeedService } from './seed.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/modules/rol/guards/roles.guard';
import { Roles } from 'src/modules/rol/decorators/roles.decorator';

@Controller('seed')
// @UseGuards(AuthGuard('jwt'), RolesGuard)
// @Roles('admin')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  async runSeed() {
    return this.seedService.runSeed();
  }
}