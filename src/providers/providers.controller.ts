import { Controller, Get, Param, Patch, Body, UseGuards } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('providers')
@UseGuards(JwtAuthGuard)
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

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.providersService.update(id, data);
  }
}
