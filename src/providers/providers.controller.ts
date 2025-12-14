import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { ProvidersService } from './providers.service';

@Controller('providers')
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  @Get()
  async findAll() {
    return this.providersService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.providersService.findById(id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() data: { status: string }) {
    return this.providersService.updateStatus(id, data.status);
  }
}
